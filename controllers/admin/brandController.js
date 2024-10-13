const Brand = require('../../models/brandModel')

const Product = require('../../models/productModel');

// Fetch and display categories with pagination
const getBrand = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;
        const searchQuery = req.query.search || '';

        const brandFilter = {
            $or: [
                { brandbrand: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } }
            ]
        };

        const brandData = await Brand.find(brandFilter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalBrand = await Brand.countDocuments(brandFilter);
        const totalPages = Math.ceil(totalBrand / limit);

        res.render('./brand/brand', {
            brand: brandData,//change pending
            currentPage: page,
            totalPage: totalPages,
            totalBrand: totalBrand,
            searchQuery: searchQuery,

        });

    } catch (error) {
        console.log(error.message);
        next(error)
    }
};

const addBrand = async (req, res, next) => {
    try {
        const { brandName, description } = req.body;
        console.log(req.body)
        // Case-insensitive check for existing brand
        let brandCheck = await Brand.findOne({ brandName: new RegExp('^' + brandName + '$', 'i') });

        if (brandCheck) {
            req.flash('error', 'brand Name Already Exists');
            //  console.log('name already exists');
            return res.redirect('/admin/brand');
        }

        // Create new brand
        const brandData = new Brand({
            brandName: brandName,
            description: description,
            //  brandOffer: brandOffer || 0, // Default to 0 if not provided
            //offerExpiry: offerExpiry || null     // Default to null if no expiry
        });

        await brandData.save();
        req.flash('success', 'brand Successfully Created');
        return res.redirect('/admin/brand');
    } catch (error) {
        console.error(error.message);
        next(error)
    }
};

// Unlist brand
const unlistBrand = async (req, res, next) => {
    const id = req.query.id;
    try {
        const brand = await Brand.findByIdAndUpdate(id, { isListed: false });
        if (!brand) {
            return res.status(404).send('brand not found');
        }
        return res.redirect('/admin/brand');
    } catch (error) {
        console.log(error.message);
        next(error)

    }
};

// List brand
const listBrand = async (req, res, next) => {
    const id = req.query.id;
    try {
        const brand = await Brand.findByIdAndUpdate(id, { isListed: true });
        if (!brand) {
            return res.status(404).send('brand not found');
        }
        return res.redirect('/admin/brand');
    } catch (error) {
        next(error)
    }
};


const getEditbrand = async (req, res, next) => {
    try {
        const brandId = req.params.id;
        const brand = await Brand.findById(brandId);

        if (!brand) {
            req.flash('error', 'brand not found');
            return res.redirect('/admin/brand');
        }

        res.render('./brand/edit-brand', {
            brand: brand,
        });
    } catch (error) {
        console.error(error.message);
        next(error)
    }
};


const postEditbrand = async (req, res, next) => {
    try {
        const brandId = req.params.id;
        const { brandName, description } = req.body;

        // Check if another brand with the same name exists
        const existingbrand = await Brand.findOne({ brandName:new RegExp('^'+brandName+'$','i') });

        if (existingbrand && existingbrand._id.toString() !== brandId) {
            req.flash('error', 'brand name must be unique');
            return res.redirect(`/admin/edit-brand/${brandId}`);
        }

        // Proceed with updating the brand
        const updatedbrand = await Brand.findByIdAndUpdate(
            brandId,
            {
                brandName,
                description,
            },
            { new: true }
        );

        if (!updatedbrand) {
            req.flash('error', 'Failed to update brand');
            return res.redirect('/admin/brand');
        }


        req.flash('succes', 'brand updated successfully');
        return res.redirect('/admin/brand');
    } catch (error) {
        console.error(error.message);
        next(error)
    }
};



module.exports = {
    getBrand,
    addBrand,
    listBrand,
    unlistBrand,
    getEditbrand,
    postEditbrand
};
