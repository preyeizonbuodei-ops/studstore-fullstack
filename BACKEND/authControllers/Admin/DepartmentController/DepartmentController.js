
const departmentValidation = require("../../../middlewares/Admin/ValidateDepartment");
const Department = require("../../../modules/DepartmentModule/DepartmentSchema");
const MajorArea = require("../../../modules/DepartmentModule/MajorAreaSchema");


exports.CreateDepartment = async (req, res) => {
    try {
        const { error, value } = departmentValidation.validate(req.body);



        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        const existingDepartment = await Department.findOne({
            name: value.name,
        });

        if (existingDepartment) {
            return res.status(409).json({
                success: false,
                message: "Department already exists",
            });
        }

        const department = await Department.create(value);

        return res.status(201).json({
            success: true,
            message: "Department created successfully",
            department,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Department already exists",
            });
        }

        console.error("Create Department Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 }).lean();

    const majorAreas = await MajorArea.find()
      .select("department")
      .lean();

    const majorAreaCounts = majorAreas.reduce((counts, area) => {
      const departmentId = area.department.toString();

      counts[departmentId] = (counts[departmentId] || 0) + 1;

      return counts;
    }, {});

    const departmentsWithMajorAreas = departments.map((department) => ({
      ...department,
      majorAreaCount: majorAreaCounts[department._id.toString()] || 0,
    }));

    return res.status(200).json({
      success: true,
      departments: departmentsWithMajorAreas,
    });
  } catch (error) {
    console.error("Get departments error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve departments",
    });
  }
};



exports.getDepartmentById = async (req, res) => {
    try {
        const { departmentId } = req.params;

        const department = await Department.findById(departmentId);

        if (!department) {
            return res.status(404).json({
                success: false,
                message: "No Department Found",
            });
        }

        const majorAreas = await MajorArea.find({
            department: departmentId,
        }).sort({ name: 1 });

        return res.status(200).json({
            success: true,
            department,
            majorAreas,
        });
    } catch (error) {
        console.error("Get Department Error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


const mongoose = require("mongoose");

exports.UpdateDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID",
      });
    }

    const { error, value } = departmentValidation.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const department = await Department.findById(departmentId);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const duplicateDepartment = await Department.findOne({
      name: value.name,
      _id: { $ne: departmentId },
    });

    if (duplicateDepartment) {
      return res.status(409).json({
        success: false,
        message: "Another department already uses this name",
      });
    }

    Object.assign(department, value);

    await department.save();

    return res.status(200).json({
      success: true,
      message: "Department updated successfully",
      department,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Department already exists",
      });
    }

    console.error("Update Department Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update department",
    });
  }
};

exports.DeleteDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID",
      });
    }

    const department = await Department.findById(departmentId);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const majorAreaCount = await MajorArea.countDocuments({
      department: departmentId,
    });

    if (majorAreaCount > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This department has major areas. Delete or reassign its major areas before deleting the department.",
        majorAreaCount,
      });
    }

    await Department.findByIdAndDelete(departmentId);

    return res.status(200).json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (error) {
    console.error("Delete Department Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete department",
    });
  }
};
