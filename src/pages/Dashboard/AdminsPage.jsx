import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { adminManagementAPI } from "../../api";
import Loader from "../../components/Ui/Loader/Loader";
import { X, Edit2, Trash2, Plus, Search, Eye } from "lucide-react";

const AdminsPage = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  const [admins, setAdmins] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("create"); // 'create' or 'edit'
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [viewingAdmin, setViewingAdmin] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "admin",
    permission_ids: [],
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch admins
  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminManagementAPI.getAdmins();
      
      // Handle nested response structure: 
      // response.data = { success, message, data: { data: [...admins], links, meta } }
      // The actual admins array is at response.data.data.data
      let data = [];
      if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
        data = response.data.data.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        data = response.data.data;
      } else if (Array.isArray(response.data)) {
        data = response.data;
      }
      
      console.log("Fetched admins:", data); // Debug log
      setAdmins(data);
    } catch (err) {
      console.error("Error fetching admins:", err);
      showToast(
        err.response?.data?.message || t("dashboard.admins.errors.fetch") || "Failed to load administrators",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Fetch permissions
  const fetchPermissions = useCallback(async () => {
    try {
      const response = await adminManagementAPI.getPermissions();
      
      // Handle nested response structure
      let data = [];
      if (response.data?.data && Array.isArray(response.data.data)) {
        data = response.data.data;
      } else if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
        data = response.data.data.data;
      }
      
      setPermissions(data);
    } catch (err) {
      console.error("Error fetching permissions:", err);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
    fetchPermissions();
  }, [fetchAdmins, fetchPermissions]);

  // Filter admins based on search
  const filteredAdmins = admins.filter((admin) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      admin.name?.toLowerCase().includes(searchLower) ||
      admin.email?.toLowerCase().includes(searchLower) ||
      admin.phone?.toLowerCase().includes(searchLower) ||
      admin.code?.toLowerCase().includes(searchLower)
    );
  });

  // Open create modal
  const handleCreate = () => {
    setModalType("create");
    setSelectedAdmin(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "admin",
      permission_ids: [],
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Open edit modal
  const handleEdit = (admin) => {
    setModalType("edit");
    setSelectedAdmin(admin);
    setFormData({
      name: admin.name || "",
      email: admin.email || "",
      phone: admin.phone || "",
      password: "", // Don't pre-fill password
      role: admin.role || "admin",
      permission_ids: admin.permissions?.map((p) => p.id) || admin.permission_ids || [],
    });
    setFormErrors({});
    setShowModal(true);
  };

  // Open view details modal
  const handleViewDetails = (admin) => {
    setViewingAdmin(admin);
    setShowDetailsModal(true);
  };

  // Open delete confirmation modal
  const handleDeleteClick = (admin) => {
    setAdminToDelete(admin);
    setShowDeleteModal(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!adminToDelete) return;

    try {
      await adminManagementAPI.deleteAdmin(adminToDelete.id);
      showToast(t("dashboard.admins.deleteSuccess"));
      setShowDeleteModal(false);
      setAdminToDelete(null);
      fetchAdmins();
    } catch (err) {
      console.error("Error deleting admin:", err);
      showToast(
        err.response?.data?.message || t("dashboard.admins.errors.delete") || "Failed to delete administrator",
        "error"
      );
      setShowDeleteModal(false);
      setAdminToDelete(null);
    }
  };

  // Cancel delete
  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setAdminToDelete(null);
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle permission toggle
  const handlePermissionToggle = (permissionId) => {
    setFormData((prev) => {
      const permissionIds = prev.permission_ids || [];
      const isSelected = permissionIds.includes(permissionId);
      return {
        ...prev,
        permission_ids: isSelected
          ? permissionIds.filter((id) => id !== permissionId)
          : [...permissionIds, permissionId],
      };
    });
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = t("dashboard.admins.errors.nameRequired");
    }
    if (!formData.email.trim()) {
      errors.email = t("dashboard.admins.errors.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t("dashboard.admins.errors.emailInvalid");
    }
    if (modalType === "create" && !formData.password.trim()) {
      errors.password = t("dashboard.admins.errors.passwordRequired");
    } else if (formData.password && formData.password.length < 6) {
      errors.password = t("dashboard.admins.errors.passwordMin");
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const submitData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        role: formData.role,
        permission_ids: formData.permission_ids,
      };

      // Only include password if it's provided (for create or edit)
      if (formData.password.trim()) {
        submitData.password = formData.password;
      }

      if (modalType === "create") {
        await adminManagementAPI.createAdmin(submitData);
        showToast(t("dashboard.admins.createSuccess"));
      } else {
        await adminManagementAPI.updateAdmin(selectedAdmin.id, submitData);
        showToast(t("dashboard.admins.updateSuccess"));
      }

      setShowModal(false);
      fetchAdmins();
    } catch (err) {
      console.error("Error saving admin:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (modalType === "create"
          ? t("dashboard.admins.errors.create") || "Failed to create administrator"
          : t("dashboard.admins.errors.update") || "Failed to update administrator");
      showToast(errorMessage, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Get permission names for display
  const getPermissionNames = (admin) => {
    if (admin.permissions && Array.isArray(admin.permissions)) {
      return admin.permissions.map((p) => p.name || p.title).join(" - ");
    }
    if (admin.permission_ids && Array.isArray(admin.permission_ids)) {
      const permissionNames = admin.permission_ids
        .map((id) => {
          const perm = permissions.find((p) => p.id === id);
          return perm?.name || perm?.title || `Permission ${id}`;
        })
        .filter(Boolean);
      return permissionNames.join(" - ");
    }
    return "-";
  };

  if (loading && admins.length === 0) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 ${isRTL ? "left-4" : "right-4"} z-50 px-4 sm:px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-sm ${
            toast.type === "error"
              ? "bg-red-500 text-white"
              : "bg-green-500 text-white"
          }`}
        >
          <span className="text-sm sm:text-base">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 hover:opacity-75 flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-main">
          {t("dashboard.admins.title")}
        </h1>
        <button
          onClick={handleCreate}
          className="w-full sm:w-auto bg-main text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 font-semibold shadow-md text-sm sm:text-base"
        >
          <Plus size={18} className="sm:w-5 sm:h-5" />
          {t("dashboard.admins.addAdmin")}
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4 sm:mb-6">
        <div className="relative">
          <Search
            className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "right-3" : "left-3"} text-gray-400`}
            size={18}
          />
          <input
            type="text"
            placeholder={t("dashboard.admins.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full ${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"} py-2 sm:py-2.5 border-2 border-gray-300 rounded-lg outline-none focus:border-main transition text-sm sm:text-base ${isRTL ? "text-right" : "text-left"}`}
          />
        </div>
      </div>

      {/* Admins Table - Desktop View */}
      <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-main text-white">
              <tr>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-semibold">
                  {t("dashboard.admins.accountNumber")}
                </th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-semibold">
                  {t("dashboard.admins.name")}
                </th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-semibold">
                  {t("dashboard.admins.phone")}
                </th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-semibold">
                  {t("dashboard.admins.email")}
                </th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-semibold">
                  {t("dashboard.admins.jobTitle")}
                </th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-semibold">
                  {t("dashboard.admins.permissions")}
                </th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-semibold">
                  {t("dashboard.admins.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    {searchTerm
                      ? t("dashboard.admins.noResults")
                      : t("dashboard.admins.noAdmins")}
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => (
                  <tr
                    key={admin.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition"
                  >
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm">{admin.code || admin.id || "-"}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium">{admin.name || "-"}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm">{admin.phone || "-"}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm">{admin.email || "-"}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm">{admin.role || admin.job_title || "-"}</td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-600 max-w-xs truncate">
                      {getPermissionNames(admin)}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(admin)}
                          className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 rounded transition"
                          title={t("dashboard.admins.viewDetails") || "View Details"}
                        >
                          <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </button>
                        <button
                          onClick={() => handleEdit(admin)}
                          className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                          title={t("dashboard.admins.edit")}
                        >
                          <Edit2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(admin)}
                          className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded transition"
                          title={t("dashboard.admins.delete")}
                        >
                          <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredAdmins.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
            {searchTerm
              ? t("dashboard.admins.noResults")
              : t("dashboard.admins.noAdmins")}
          </div>
        ) : (
          filteredAdmins.map((admin) => (
            <div
              key={admin.id}
              className="bg-white rounded-lg shadow-md p-4 space-y-3"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900">{admin.name || "-"}</h3>
                  <p className="text-sm text-gray-500">{admin.code || admin.id || "-"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewDetails(admin)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded transition"
                    title={t("dashboard.admins.viewDetails") || "View Details"}
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => handleEdit(admin)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                    title={t("dashboard.admins.edit")}
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(admin)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                    title={t("dashboard.admins.delete")}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("dashboard.admins.phone")}:</span>
                  <span className="text-gray-900">{admin.phone || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("dashboard.admins.email")}:</span>
                  <span className="text-gray-900 break-all">{admin.email || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("dashboard.admins.jobTitle")}:</span>
                  <span className="text-gray-900">{admin.role || admin.job_title || "-"}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">{t("dashboard.admins.permissions")}:</span>
                  <span className="text-gray-900 text-xs">{getPermissionNames(admin) || "-"}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center z-10">
              <h2 className="text-xl sm:text-2xl font-bold text-main">
                {modalType === "create"
                  ? t("dashboard.admins.addAdmin")
                  : t("dashboard.admins.editAdmin")}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 transition flex-shrink-0"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-6">
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("dashboard.admins.name")} *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 rounded-lg outline-none transition ${
                      formErrors.name
                        ? "border-red-500"
                        : "border-gray-300 focus:border-main"
                    }`}
                    placeholder={t("dashboard.admins.namePlaceholder")}
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-xs sm:text-sm text-red-500">{formErrors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("dashboard.admins.email")} *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 rounded-lg outline-none transition ${
                      formErrors.email
                        ? "border-red-500"
                        : "border-gray-300 focus:border-main"
                    }`}
                    placeholder={t("dashboard.admins.emailPlaceholder")}
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-xs sm:text-sm text-red-500">{formErrors.email}</p>
                  )}
                </div>

                {/* Phone/Mobile */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("dashboard.admins.phone")} ({t("dashboard.admins.optional")})
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 rounded-lg outline-none transition ${
                      formErrors.phone
                        ? "border-red-500"
                        : "border-gray-300 focus:border-main"
                    }`}
                    placeholder={t("dashboard.admins.phonePlaceholder") || "Enter phone number"}
                  />
                  {formErrors.phone && (
                    <p className="mt-1 text-xs sm:text-sm text-red-500">{formErrors.phone}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("dashboard.admins.password")} {modalType === "create" ? "*" : `(${t("dashboard.admins.optional")})`}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 rounded-lg outline-none transition ${
                      formErrors.password
                        ? "border-red-500"
                        : "border-gray-300 focus:border-main"
                    }`}
                    placeholder={modalType === "create" ? t("dashboard.admins.passwordPlaceholder") : t("dashboard.admins.passwordPlaceholderEdit")}
                  />
                  {formErrors.password && (
                    <p className="mt-1 text-xs sm:text-sm text-red-500">{formErrors.password}</p>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("dashboard.admins.role")}
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-gray-300 rounded-lg outline-none focus:border-main transition"
                  >
                    <option value="admin">{t("dashboard.admins.roleAdmin")}</option>
                    <option value="super_admin">{t("dashboard.admins.roleSuperAdmin")}</option>
                  </select>
                </div>

                {/* Permissions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {t("dashboard.admins.permissions")}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 max-h-48 sm:max-h-60 overflow-y-auto p-3 border-2 border-gray-200 rounded-lg">
                    {permissions.map((permission) => (
                      <label
                        key={permission.id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={formData.permission_ids?.includes(permission.id) || false}
                          onChange={() => handlePermissionToggle(permission.id)}
                          className="w-4 h-4 text-main border-gray-300 rounded focus:ring-main flex-shrink-0"
                        />
                        <span className="text-gray-700 break-words">
                          {permission.name || permission.title || `Permission ${permission.id}`}
                        </span>
                      </label>
                    ))}
                  </div>
                  {permissions.length === 0 && (
                    <p className="text-xs sm:text-sm text-gray-500 mt-2">
                      {t("dashboard.admins.noPermissions")}
                    </p>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm sm:text-base"
                >
                  {t("dashboard.admins.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-main text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {submitting
                    ? t("dashboard.admins.saving")
                    : modalType === "create"
                    ? t("dashboard.admins.add")
                    : t("dashboard.admins.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetailsModal && viewingAdmin && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center z-10">
              <h2 className="text-xl sm:text-2xl font-bold text-main">
                {t("dashboard.admins.adminDetails")}
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700 transition flex-shrink-0"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6">
              <div className="space-y-4">
                {/* Account Number */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pb-3 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-500 min-w-[140px]">
                    {t("dashboard.admins.accountNumber")}:
                  </span>
                  <span className="text-sm sm:text-base text-gray-900 font-medium">
                    {viewingAdmin.code || viewingAdmin.id || "-"}
                  </span>
                </div>

                {/* Name */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pb-3 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-500 min-w-[140px]">
                    {t("dashboard.admins.name")}:
                  </span>
                  <span className="text-sm sm:text-base text-gray-900">
                    {viewingAdmin.name || "-"}
                  </span>
                </div>

                {/* Email */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pb-3 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-500 min-w-[140px]">
                    {t("dashboard.admins.email")}:
                  </span>
                  <span className="text-sm sm:text-base text-gray-900 break-all">
                    {viewingAdmin.email || "-"}
                  </span>
                </div>

                {/* Phone */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pb-3 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-500 min-w-[140px]">
                    {t("dashboard.admins.phone")}:
                  </span>
                  <span className="text-sm sm:text-base text-gray-900">
                    {viewingAdmin.phone || "-"}
                  </span>
                </div>

                {/* Role */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pb-3 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-500 min-w-[140px]">
                    {t("dashboard.admins.role")}:
                  </span>
                  <span className="text-sm sm:text-base text-gray-900">
                    {viewingAdmin.role === "super_admin" 
                      ? t("dashboard.admins.roleSuperAdmin")
                      : t("dashboard.admins.roleAdmin")}
                  </span>
                </div>

                {/* Status */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pb-3 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-500 min-w-[140px]">
                    {t("dashboard.admins.status")}:
                  </span>
                  <span className={`text-sm sm:text-base font-medium ${
                    viewingAdmin.is_active 
                      ? "text-green-600" 
                      : "text-red-600"
                  }`}>
                    {viewingAdmin.is_active 
                      ? t("dashboard.admins.active")
                      : t("dashboard.admins.inactive")}
                  </span>
                </div>

                {/* Permissions */}
                <div className="pb-3 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-500 block mb-2">
                    {t("dashboard.admins.permissions")}:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {viewingAdmin.permissions && Array.isArray(viewingAdmin.permissions) && viewingAdmin.permissions.length > 0 ? (
                      viewingAdmin.permissions.map((perm) => (
                        <span
                          key={perm.id}
                          className="px-3 py-1 bg-main/10 text-main rounded-full text-xs sm:text-sm"
                        >
                          {perm.name || perm.title || `Permission ${perm.id}`}
                        </span>
                      ))
                    ) : viewingAdmin.permission_ids && Array.isArray(viewingAdmin.permission_ids) && viewingAdmin.permission_ids.length > 0 ? (
                      viewingAdmin.permission_ids.map((permId) => {
                        const perm = permissions.find((p) => p.id === permId);
                        return perm ? (
                          <span
                            key={permId}
                            className="px-3 py-1 bg-main/10 text-main rounded-full text-xs sm:text-sm"
                          >
                            {perm.name || perm.title || `Permission ${permId}`}
                          </span>
                        ) : null;
                      })
                    ) : (
                      <span className="text-sm text-gray-500">
                        {t("dashboard.admins.noPermissions")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Created At */}
                {viewingAdmin.created_at && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 pb-3 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-500 min-w-[140px]">
                      {t("dashboard.admins.createdAt")}:
                    </span>
                    <span className="text-sm sm:text-base text-gray-900">
                      {new Date(viewingAdmin.created_at).toLocaleString(
                        isRTL ? "ar-EG" : "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </div>
                )}

                {/* Updated At */}
                {viewingAdmin.updated_at && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-sm font-medium text-gray-500 min-w-[140px]">
                      {t("dashboard.admins.updatedAt")}:
                    </span>
                    <span className="text-sm sm:text-base text-gray-900">
                      {new Date(viewingAdmin.updated_at).toLocaleString(
                        isRTL ? "ar-EG" : "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 bg-main text-white rounded-lg hover:bg-green-700 transition font-medium text-sm sm:text-base"
                >
                  {t("dashboard.admins.close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && adminToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl sm:text-2xl font-bold text-red-600">
                {t("dashboard.admins.confirmDeleteTitle")}
              </h2>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6">
              <p className="text-gray-700 mb-4">
                {t("dashboard.admins.confirmDeleteMessage")}
              </p>
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">{t("dashboard.admins.name")}:</span> {adminToDelete.name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{t("dashboard.admins.email")}:</span> {adminToDelete.email}
                </p>
              </div>
              <p className="text-sm text-red-600 font-medium">
                {t("dashboard.admins.deleteWarning")}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm sm:text-base"
              >
                {t("dashboard.admins.cancel")}
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm sm:text-base"
              >
                {t("dashboard.admins.deleteConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminsPage;

