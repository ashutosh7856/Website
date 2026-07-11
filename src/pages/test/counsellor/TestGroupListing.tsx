import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Trash2, Edit, Globe, GlobeLock } from "lucide-react";
import toast from "react-hot-toast";
import { getAllTestGroups, deleteTestGroup, publishUnpublishTestGroup } from "@/api/testGroup";
import type { TestGroup } from "@/types/testGroup";

export function TestGroupListing() {
  const navigate = useNavigate();
  const [testGroups, setTestGroups] = useState<TestGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const counsellorId = localStorage.getItem("phone") || "";

  useEffect(() => {
    fetchTestGroups();
  }, []);

  const fetchTestGroups = async () => {
    try {
      setLoading(true);
      const response = await getAllTestGroups(counsellorId);
      if (response.status) {
        setTestGroups(response.data);
      }
    } catch (error) {
      toast.error("Failed to fetch test groups");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (testGroupId: string, testGroupName: string) => {
    if (!confirm(`Are you sure you want to delete "${testGroupName}"?`)) return;

    try {
      const response = await deleteTestGroup(counsellorId, testGroupId);
      if (response.status) {
        toast.success("Test group deleted successfully");
        fetchTestGroups();
      } else {
        toast.error("Failed to delete test group");
      }
    } catch (error) {
      toast.error("Failed to delete test group");
      console.error(error);
    }
  };

  const handlePublishToggle = async (testGroupId: string, currentStatus: boolean) => {
    try {
      const response = await publishUnpublishTestGroup(counsellorId, testGroupId, !currentStatus);
      if (response.status) {
        toast.success(currentStatus ? "Test group unpublished" : "Test group published");
        fetchTestGroups();
      } else {
        toast.error("Failed to update publish status");
      }
    } catch (error) {
      toast.error("Failed to update publish status");
      console.error(error);
    }
  };

  const filteredGroups = testGroups.filter((group) =>
    group.testGroupName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (timestamp: { seconds: number; nanos: number }) => {
    return new Date(timestamp.seconds * 1000).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[--btn-primary] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-(--text-muted)">Loading test groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-(--text-app-primary)">Test Groups</h1>
          <p className="text-(--text-muted) mt-1">Manage your test series collections</p>
        </div>
        <button
          onClick={() => navigate("/counselor/test-groups/create")}
          className="flex items-center gap-2 px-6 py-3 bg-(--btn-primary) text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={20} />
          Create Test Group
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-(--text-muted)" size={20} />
          <input
            type="text"
            placeholder="Search test groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-(--btn-primary) focus:border-transparent"
          />
        </div>
      </div>

      {/* Test Groups Grid */}
      {filteredGroups.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-(--text-app-primary) mb-2">
            {searchQuery ? "No test groups found" : "No test groups yet"}
          </h3>
          <p className="text-(--text-muted) mb-6">
            {searchQuery
              ? "Try adjusting your search"
              : "Create your first test group to get started"}
          </p>
          {!searchQuery && (
            <button
              onClick={() => navigate("/counselor/test-groups/create")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-(--btn-primary) text-white rounded-xl font-medium hover:opacity-90"
            >
              <Plus size={20} />
              Create Test Group
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <div
              key={group.testGroupId}
              onClick={() => navigate(`/counselor/test-groups/${group.testGroupId}`)}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            >
              {/* Banner Image */}
              <div className="h-40 bg-gradient-to-r from-blue-500 to-purple-600 relative">
                {group.bannerImagUrl ? (
                  <img loading="lazy" decoding="async"
                    src={group.bannerImagUrl}
                    alt={group.testGroupName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white text-4xl font-bold opacity-50">
                      {group.testGroupName.charAt(0)}
                    </span>
                  </div>
                )}
                {/* Publish Badge */}
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${group.published
                      ? "bg-green-500 text-white"
                      : "bg-gray-500 text-white"
                      }`}
                  >
                    {group.published ? "Published" : "Draft"}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-(--text-app-primary) mb-2 line-clamp-2">
                  {group.testGroupName}
                </h3>
                <p className="text-sm text-(--text-muted) mb-4 line-clamp-2">
                  {group.testGroupDescription || "No description provided"}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-(--text-muted)">Tests:</span>
                    <span className="font-semibold text-(--text-app-primary)">
                      {group.attachedTestIds.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-(--text-muted)">Price:</span>
                    <span className="font-semibold text-(--text-app-primary)">
                      ₹{group.price}
                    </span>
                  </div>
                  {group.soldCount > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-(--text-muted)">Sold:</span>
                      <span className="font-semibold text-green-600">
                        {group.soldCount}
                      </span>
                    </div>
                  )}
                </div>

                {/* Rating */}
                {group.rating && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-4 h-4 ${star <= group.rating!
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-gray-200 text-gray-200"
                            }`}
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-(--text-muted)">
                      ({group.ratingCount} reviews)
                    </span>
                  </div>
                )}

                <div className="text-xs text-(--text-muted) mb-4">
                  Created on {formatDate(group.createdAt)}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/counselor/test-groups/edit/${group.testGroupId}`);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium cursor-pointer"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePublishToggle(group.testGroupId, group.published);
                    }}
                    className={`flex items-center justify-center p-2 rounded-lg transition-colors cursor-pointer ${group.published
                      ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
                      : "bg-green-50 text-green-600 hover:bg-green-100"
                      }`}
                  >
                    {group.published ? <GlobeLock size={16} /> : <Globe size={16} />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(group.testGroupId, group.testGroupName);
                    }}
                    className="flex items-center justify-center p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
