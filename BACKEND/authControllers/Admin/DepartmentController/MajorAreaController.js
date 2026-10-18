const majorAreaValidation = require("../../../middlewares/Admin/ValidateMajorArea");
const Department = require("../../../modules/DepartmentModule/DepartmentSchema");
const MajorArea = require("../../../modules/DepartmentModule/MajorAreaSchema");


// Admin: Create a major area
exports.createMajorArea = async (req, res) => {
    try {
        const { error, value } = majorAreaValidation.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        // Confirm that the department exists
        const departmentExists = await Department.findById(
            value.department
        );

        if (!departmentExists) {
            return res.status(404).json({
                success: false,
                message: "Department not found",
            });
        }

        // Prevent duplicate major areas within the same department
        const existingMajorArea = await MajorArea.findOne({
            name: value.name,
            department: value.department,
        });

        if (existingMajorArea) {
            return res.status(409).json({
                success: false,
                message:
                    "This major area already exists in this department",
            });
        }

        const majorArea = await MajorArea.create(value);

        return res.status(201).json({
            success: true,
            message: "Major area created successfully",
            majorArea,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message:
                    "This major area already exists in this department",
            });
        }

        console.error("Create Major Area Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


// Students: Get all major areas or filter by department ID
exports.getMajorAreas = async (req, res) => {
    try {
        const { departmentId } = req.query;

        const filter = {};

        if (departmentId) {
            if (!/^[0-9a-fA-F]{24}$/.test(departmentId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid department ID",
                });
            }

            const departmentExists = await Department.findById(
                departmentId
            );

            if (!departmentExists) {
                return res.status(404).json({
                    success: false,
                    message: "Department not found",
                });
            }

            filter.department = departmentId;
        }

        const majorAreas = await MajorArea.find(filter)
            .populate("department", "name")
            .sort({ name: 1 });

        return res.status(200).json({
            success: true,
            count: majorAreas.length,
            majorAreas,
        });
    } catch (error) {
        console.error("Get Major Areas Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


// Students: Get one major area by ID
exports.getMajorAreaById = async (req, res) => {
    try {
        const { majorAreaId } = req.params;

        if (!/^[0-9a-fA-F]{24}$/.test(majorAreaId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid major area ID",
            });
        }

        const majorArea = await MajorArea.findById(majorAreaId)
            .populate("department", "name");

        if (!majorArea) {
            return res.status(404).json({
                success: false,
                message: "Major area not found",
            });
        }

        return res.status(200).json({
            success: true,
            majorArea,
        });
    } catch (error) {
        console.error("Get Major Area By ID Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Admin: Update a major area
exports.updateMajorArea = async (req, res) => {
    try {
        const { majorAreaId } = req.params;

        if (!/^[0-9a-fA-F]{24}$/.test(majorAreaId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid major area ID",
            });
        }

        const { error, value } = majorAreaValidation.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const majorArea = await MajorArea.findById(majorAreaId);

        if (!majorArea) {
            return res.status(404).json({
                success: false,
                message: "Major area not found",
            });
        }

        const departmentExists = await Department.findById(value.department);

        if (!departmentExists) {
            return res.status(404).json({
                success: false,
                message: "Department not found",
            });
        }

        const existingMajorArea = await MajorArea.findOne({
            _id: { $ne: majorAreaId },
            name: value.name,
            department: value.department,
        });

        if (existingMajorArea) {
            return res.status(409).json({
                success: false,
                message: "This major area already exists in this department",
            });
        }

        Object.assign(majorArea, value);

        await majorArea.save();

        return res.status(200).json({
            success: true,
            message: "Major area updated successfully",
            majorArea,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This major area already exists in this department",
            });
        }

        console.error("Update Major Area Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


// Admin: Delete a major area
exports.deleteMajorArea = async (req, res) => {
    try {
        const { majorAreaId } = req.params;

        if (!/^[0-9a-fA-F]{24}$/.test(majorAreaId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid major area ID",
            });
        }

        const majorArea = await MajorArea.findById(majorAreaId);

        if (!majorArea) {
            return res.status(404).json({
                success: false,
                message: "Major area not found",
            });
        }

        await MajorArea.findByIdAndDelete(majorAreaId);

        return res.status(200).json({
            success: true,
            message: "Major area deleted successfully",
        });
    } catch (error) {
        console.error("Delete Major Area Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};