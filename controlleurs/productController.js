const Product = require('../modeles/Product');
const Review = require('../modeles/Review');
const User = require('../modeles/User');

// Get all products with filters
exports.getProducts = async (req, res) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      search,
      badges,
      targetAudience,
      useCase,
      sort,
      page = 1,
      limit = 12
    } = req.query;

    const filter = {};

    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (badges) filter.badges = { $in: badges.split(',') };
    if (targetAudience) filter.targetAudience = { $in: targetAudience.split(',') };
    if (useCase) filter.useCase = { $in: useCase.split(',') };
    if (search) {
      filter.$text = { $search: search };
    }

    filter.approved = true;

    let sortOption = {};
    switch (sort) {
      case 'price-asc':
        sortOption = { price: 1 };
        break;
      case 'price-desc':
        sortOption = { price: -1 };
        break;
      case 'rating':
        sortOption = { rating: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      default:
        sortOption = { systemRecommended: -1, rating: -1 };
    }

    const products = await Product.find(filter)
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('addedBy', 'username');

    const count = await Product.countDocuments(filter);

    res.json({
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('addedBy', 'username email');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const reviews = await Review.find({ product: req.params.id })
      .populate('user', 'username userType role')
      .sort({ createdAt: -1 });

    // Format the response to match frontend expectations
    const productWithReviews = {
      ...product.toObject(),
      recommendations: reviews.map(review => ({
        id: review._id,
        userId: review.user?._id,
        userName: review.user?.username || 'Anonymous',
        userType: review.userType,
        role: review.role,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        helpful: review.helpful || 0,
        date: review.createdAt,
        isSystem: false
      }))
    };

    res.json(productWithReviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new product
exports.createProduct = async (req, res) => {
  try {
    // Extract initial review from request body
    const { initialReview, ...productData } = req.body;

    // Get the user to check if they are a system user
    const user = await User.findById(req.user.id);
    const isSystemUser = user && user.is_system === true;

    // Create product with proper defaults
    // If user is_system is true, set systemRecommended to true
    const newProduct = {
      ...productData,
      addedBy: req.user.id,
      approved: req.user.role === 'admin' || true, // Auto-approve for now
      systemRecommended: isSystemUser, // Set based on user's is_system flag
      isSystemCreated: isSystemUser // Also mark as system created
    };

    const product = new Product(newProduct);
    await product.save();

    // If there's an initial review, create it
    if (initialReview && initialReview.title && initialReview.comment) {
      const reviewData = {
        product: product._id,
        user: req.user.id,
        rating: initialReview.rating || 5,
        title: initialReview.title,
        comment: initialReview.comment,
        helpful: 0,
        verified: true,
        // If user is_system is true, mark the review as from an expert
        userType: isSystemUser ? 'administrator' : (initialReview.userType || user.userType || 'other'),
        role: isSystemUser ? 'Expert Reviewer' : (initialReview.role || '')
      };

      const review = new Review(reviewData);
      await review.save();

      // Update product with review stats
      product.rating = review.rating;
      product.reviewCount = 1;
      await product.save();
    }

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.addedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(product, req.body);
    await product.save();

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.addedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await product.remove();
    await Review.deleteMany({ product: req.params.id });

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get recommended products
exports.getRecommendations = async (req, res) => {
  try {
    const { userType, useCase, budget } = req.query;

    const filter = {
      approved: true,
      systemRecommended: true
    };

    if (userType) filter.targetAudience = userType;
    if (useCase) filter.useCase = useCase;
    if (budget) {
      filter.price = { $lte: Number(budget) };
    }

    const recommendations = await Product.find(filter)
      .sort({ rating: -1 })
      .limit(6);

    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Search products with AI-like matching
exports.searchProducts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Search query required' });
    }

    // Parse natural language query
    const itemMatch = q.match(/(?:buy a|looking for|need a?)\s+(\w+)/i);
    const purposeMatch = q.match(/for\s+([\w\s]+)$/i);

    let filter = { approved: true };

    if (itemMatch) {
      const item = itemMatch[1].toLowerCase();
      filter.category = item;
    }

    if (purposeMatch) {
      const purpose = purposeMatch[1].toLowerCase();
      const useCaseMap = {
        'teaching online': 'teaching-online',
        'online teaching': 'teaching-online',
        'presentations': 'presentations',
        'programming': 'programming',
        'coding': 'programming',
        'design': 'graphic-design',
        'video editing': 'video-editing',
        'research': 'research',
        'writing': 'writing',
        'meetings': 'meetings',
        'printing': 'printing',
        'homework': 'homework',
        'notes': 'note-taking',
        'note taking': 'note-taking'
      };

      const mappedUseCase = useCaseMap[purpose] || purpose;
      filter.useCase = mappedUseCase;
    }

    const products = await Product.find(filter)
      .sort({ systemRecommended: -1, rating: -1 })
      .limit(20);

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get user's products (for dashboard)
exports.getUserProducts = async (req, res) => {
  try {
    const products = await Product.find({ addedBy: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get user's reviews (for dashboard)
exports.getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id })
      .populate('product', 'name image price category')
      .sort({ createdAt: -1 })
      .limit(10);

    const formattedReviews = reviews.map(review => ({
      id: review._id,
      productId: review.product?._id,
      productName: review.product?.name || 'Product Removed',
      productImage: review.product?.image || '',
      productPrice: review.product?.price || 0,
      productCategory: review.product?.category || '',
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      helpful: review.helpful || 0,
      createdAt: review.createdAt
    }));

    res.json(formattedReviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get user's favorite products (for dashboard)
exports.getUserFavorites = async (req, res) => {
  try {
    // For now, return empty array as we don't have favorites model yet
    // You can implement this later with a Favorites collection
    const favorites = [];

    res.json(favorites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};