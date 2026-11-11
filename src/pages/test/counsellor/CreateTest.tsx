import { Checkbox } from "@/components/create-test/components/Checkbox";
import { Dropdown } from "@/components/create-test/components/Dropdown";
import { Input } from "@/components/create-test/components/Input";
import { Textarea } from "@/components/create-test/components/Textarea";
import UploadBox from "@/components/create-test/components/UploadBox";
import { ImageCropper } from "@/components/common/ImageCropper";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/AuthStore";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { getAllTestGroups } from "@/api/testGroup";

interface EventFormData {
  name: string;
  description: string;
  stream: string;
  course: string;
  duration: string;
  correctPoints: string;
  wrongPoints: string;
  paidAmount: string;
  instructions: string;
}

interface Section {
  sectionName: string;
  totalQuestionsSupposedToBeAdded: number;
  sectionDurationInMinutes: number;
  pointsForCorrectAnswer: number;
  negativeMarks: number;
  newSectionName?: string; // For renaming sections in update requests
  totalQuestionsAdded?: number; // For edit mode - shows existing questions
}

interface SectionInput {
  sectionName: string;
  totalQuestions: string;
  sectionDuration: string;
  correctPoints: string;
  negativeMarks: string;
}

// Validation constants
const MAX_SECTION_DURATION = 600; // Maximum 600 minutes
const MAX_MARKS_VALUE = 99.99; // Maximum 2 digits with decimals

const STREAMS = [
  { value: "ENGINEERING", label: "Engineering" },
  { value: "MEDICAL", label: "Medical" },
  { value: "COMMERCE", label: "Commerce" },
];

export function CreateTest() {
  const navigate = useNavigate();
  const location = useLocation();
  const { testGroupId: routeTestGroupId } = useParams<{ testGroupId: string }>();
  const { user, role, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const editMode = location.state?.editMode || false;
  const existingTestData = location.state?.testData || null;
  const testGroupId = routeTestGroupId || location.state?.testGroupId || existingTestData?.testGroupId || null;

  // Check if user is authenticated and is a counselor
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    if (role !== "counselor") {
      navigate("/");
      return;
    }
  }, [isAuthenticated, role, navigate]);

  const [file, setFile] = useState<File | null>(null);
  const [existingBannerUrl, setExistingBannerUrl] = useState<string | null>(null);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [enableNegativeMarking, setEnableNegativeMarking] =
    useState<boolean>(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [testSeriesId, setTestSeriesId] = useState<string | null>(null);
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);
  const [originalSectionName, setOriginalSectionName] = useState<string>(""); // Track original name for renaming
  const [currentSection, setCurrentSection] = useState<SectionInput>({
    sectionName: "",
    totalQuestions: "",
    sectionDuration: "",
    correctPoints: "",
    negativeMarks: "",
  });
  const [formData, setFormData] = useState<EventFormData>({
    name: "",
    description: "",
    stream: "",
    course: "",
    duration: "",
    correctPoints: "",
    wrongPoints: "",
    paidAmount: "",
    instructions: "",
  });
  const [sectionSwitchingAllowed, setSectionSwitchingAllowed] = useState<boolean>(false);

  // Test group selection state (for edit mode)
  const [allTestGroups, setAllTestGroups] = useState<{ testGroupId: string; testGroupName: string }[]>([]);
  const [selectedTestGroupId, setSelectedTestGroupId] = useState<string | null>(testGroupId);
  const [isLoadingTestGroups, setIsLoadingTestGroups] = useState<boolean>(false);
  const [removedSectionNames, setRemovedSectionNames] = useState<string[]>([]); // Track removed sections for update API

  // Section input validation errors
  const [sectionErrors, setSectionErrors] = useState<{
    sectionDuration?: string;
    correctPoints?: string;
    negativeMarks?: string;
  }>({});

  // Deletion confirmation modal state
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    sectionIndex: number;
    sectionName: string;
    questionCount: number;
  }>({ isOpen: false, sectionIndex: -1, sectionName: "", questionCount: 0 });

  // Prefill data in edit mode
  useEffect(() => {
    if (editMode && existingTestData) {
      setTestSeriesId(existingTestData.testSeriesId);
      setFormData({
        name: existingTestData.testName || "",
        description: existingTestData.testDescription || "",
        stream: existingTestData.stream || "",
        course: "",
        duration: existingTestData.durationInMinutes?.toString() || "",
        correctPoints: existingTestData.pointsForCorrectAnswer?.toString() || "",
        wrongPoints: existingTestData.negativeMarks?.toString() || "",
        paidAmount: "",
        instructions: existingTestData.testInstructuctions || "",
      });
      setSectionSwitchingAllowed(existingTestData.sectionSwitchingAllowed || false);
      setEnableNegativeMarking(existingTestData.negativeMarkingEnabled || false);
      // Map sections with default values for new fields including question counts
      const mappedSections = (existingTestData.listOfSection || []).map((section: Section) => ({
        sectionName: section.sectionName,
        totalQuestionsSupposedToBeAdded: section.totalQuestionsSupposedToBeAdded,
        sectionDurationInMinutes: section.sectionDurationInMinutes,
        pointsForCorrectAnswer: section.pointsForCorrectAnswer ?? 0,
        negativeMarks: section.negativeMarks ?? 0,
        totalQuestionsAdded: section.totalQuestionsAdded ?? 0, // Include question count for edit mode
      }));
      setSections(mappedSections);
      if (existingTestData.bannerImagUrl) {
        setExistingBannerUrl(existingTestData.bannerImagUrl);
      }
      // Set selected test group ID from existing data
      if (existingTestData.testGroupId) {
        setSelectedTestGroupId(existingTestData.testGroupId);
      }
    }
  }, [editMode, existingTestData]);

  // Fetch all test groups for edit mode dropdown
  useEffect(() => {
    const fetchTestGroups = async () => {
      if (!editMode || !user?.phoneNumber) return;

      setIsLoadingTestGroups(true);
      try {
        const response = await getAllTestGroups(user.phoneNumber);
        if (response.status && response.data) {
          const groups = response.data.map((group: { testGroupId: string; testGroupName: string }) => ({
            testGroupId: group.testGroupId,
            testGroupName: group.testGroupName,
          }));
          setAllTestGroups(groups);
        }
      } catch (error) {
        console.error("Failed to fetch test groups:", error);
      } finally {
        setIsLoadingTestGroups(false);
      }
    };

    fetchTestGroups();
  }, [editMode, user?.phoneNumber]);

  const handleInputChange = (
    field: keyof EventFormData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Auto-calculate total duration from sections
  useEffect(() => {
    if (sections.length > 0) {
      const totalDuration = sections.reduce((sum, section) => sum + section.sectionDurationInMinutes, 0);
      setFormData(prev => ({
        ...prev,
        duration: totalDuration.toString()
      }));
    } else if (sections.length === 0 && !editMode) {
      setFormData(prev => ({
        ...prev,
        duration: "0"
      }));
    }
  }, [sections, editMode]);

  // Validation helper for marks (max 99.99)
  const validateMarks = (value: string): { isValid: boolean; error?: string } => {
    if (!value) return { isValid: true };
    const num = parseFloat(value);
    if (isNaN(num)) return { isValid: false, error: "Must be a number" };
    if (num < 0) return { isValid: false, error: "Cannot be negative" };
    if (num > MAX_MARKS_VALUE) return { isValid: false, error: `Max ${MAX_MARKS_VALUE}` };
    // Check format: max 2 digits before decimal
    const parts = value.split('.');
    if (parts[0] && parts[0].length > 2) return { isValid: false, error: "Max 2 digits" };
    return { isValid: true };
  };

  // Validation helper for duration (max 600)
  const validateDuration = (value: string): { isValid: boolean; error?: string } => {
    if (!value) return { isValid: true };
    const num = parseInt(value);
    if (isNaN(num)) return { isValid: false, error: "Must be a number" };
    if (num < 0) return { isValid: false, error: "Cannot be negative" };
    if (num > MAX_SECTION_DURATION) return { isValid: false, error: `Max ${MAX_SECTION_DURATION} minutes` };
    return { isValid: true };
  };

  const handleSectionInputChange = (
    field: keyof SectionInput,
    value: string
  ) => {
    // Validate and update errors
    const newErrors = { ...sectionErrors };

    if (field === "sectionDuration") {
      const validation = validateDuration(value);
      newErrors.sectionDuration = validation.error;
    } else if (field === "correctPoints") {
      const validation = validateMarks(value);
      newErrors.correctPoints = validation.error;
    } else if (field === "negativeMarks") {
      const validation = validateMarks(value);
      newErrors.negativeMarks = validation.error;
    }

    setSectionErrors(newErrors);
    setCurrentSection((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddSection = () => {
    // Check for validation errors first
    if (sectionErrors.sectionDuration || sectionErrors.correctPoints || sectionErrors.negativeMarks) {
      toast.error("Please fix validation errors before adding section");
      return;
    }

    if (currentSection.sectionName && currentSection.totalQuestions && currentSection.sectionDuration &&
      currentSection.correctPoints && currentSection.negativeMarks) {

      const trimmedSectionName = currentSection.sectionName.trim();

      if (editingSectionIndex !== null) {
        // Update existing section
        const updatedSections = [...sections];
        const isNameChanged = originalSectionName !== trimmedSectionName;

        updatedSections[editingSectionIndex] = {
          sectionName: originalSectionName, // Keep original name for API identification
          totalQuestionsSupposedToBeAdded: parseInt(currentSection.totalQuestions),
          sectionDurationInMinutes: parseInt(currentSection.sectionDuration),
          pointsForCorrectAnswer: parseFloat(currentSection.correctPoints),
          negativeMarks: parseFloat(currentSection.negativeMarks),
          ...(isNameChanged ? { newSectionName: trimmedSectionName } : {}),
        };

        setSections(updatedSections);
        setEditingSectionIndex(null);
        setOriginalSectionName("");
        toast.success("Section updated");
      } else {
        // Add new section
        const newSection: Section = {
          sectionName: trimmedSectionName,
          totalQuestionsSupposedToBeAdded: parseInt(currentSection.totalQuestions),
          sectionDurationInMinutes: parseInt(currentSection.sectionDuration),
          pointsForCorrectAnswer: parseFloat(currentSection.correctPoints),
          negativeMarks: parseFloat(currentSection.negativeMarks),
        };
        setSections([...sections, newSection]);
        toast.success("Section added");
      }

      setCurrentSection({
        sectionName: "",
        totalQuestions: "",
        sectionDuration: "",
        correctPoints: "",
        negativeMarks: "",
      });
      // Duration will be auto-calculated by useEffect
    } else {
      toast.error("Please fill all section fields");
    }
  };

  const handleEditSection = (index: number) => {
    const section = sections[index];
    setCurrentSection({
      sectionName: section.newSectionName || section.sectionName, // Show new name if renamed
      totalQuestions: section.totalQuestionsSupposedToBeAdded.toString(),
      sectionDuration: section.sectionDurationInMinutes.toString(),
      correctPoints: section.pointsForCorrectAnswer.toString(),
      negativeMarks: section.negativeMarks.toString(),
    });
    setOriginalSectionName(section.sectionName); // Store original name for API
    setEditingSectionIndex(index);
    toast.info('Editing section: ' + (section.newSectionName || section.sectionName));
  };

  const handleCancelEdit = () => {
    setCurrentSection({
      sectionName: "",
      totalQuestions: "",
      sectionDuration: "",
      correctPoints: "",
      negativeMarks: "",
    });
    setEditingSectionIndex(null);
    setOriginalSectionName("");
  };

  const handleRemoveSection = (index: number) => {
    if (editingSectionIndex === index) {
      toast.error("Cannot remove section while editing. Cancel edit first.");
      return;
    }

    const sectionToRemove = sections[index];
    const sectionName = sectionToRemove.sectionName;
    const questionCount = sectionToRemove.totalQuestionsAdded || 0;

    // In edit mode, if section has questions, show confirmation modal
    if (editMode && questionCount > 0) {
      setDeleteConfirmModal({
        isOpen: true,
        sectionIndex: index,
        sectionName: sectionName,
        questionCount: questionCount,
      });
      return;
    }

    // Proceed with deletion
    confirmSectionDeletion(index, sectionName);
  };

  const confirmSectionDeletion = (index: number, sectionName: string) => {
    // In edit mode, track the removed section name to send with update API
    if (editMode) {
      setRemovedSectionNames(prev => [...prev, sectionName]);
    }

    // Remove from UI
    setSections(sections.filter((_, i) => i !== index));

    // Adjust editing index if needed
    if (editingSectionIndex !== null && index < editingSectionIndex) {
      setEditingSectionIndex(editingSectionIndex - 1);
    }
    toast.success(`Section "${sectionName}" removed`);
    // Duration will be auto-calculated by useEffect
  };

  const handleConfirmDelete = () => {
    const { sectionIndex, sectionName } = deleteConfirmModal;
    confirmSectionDeletion(sectionIndex, sectionName);
    setDeleteConfirmModal({ isOpen: false, sectionIndex: -1, sectionName: "", questionCount: 0 });
  };

  const handleCancelDelete = () => {
    setDeleteConfirmModal({ isOpen: false, sectionIndex: -1, sectionName: "", questionCount: 0 });
  };

  const handleSaveDraft = async () => {
    // Get counsellorId from authenticated user
    if (!user?.phoneNumber) {
      console.error("No counselor ID found");
      toast.error("Unable to identify counselor. Please login again.");
      return;
    }

    // Validation
    if (!formData.name.trim()) {
      toast.error("Please enter test name");
      return;
    }

    if (!formData.stream) {
      toast.error("Please select a stream");
      return;
    }

    if (sections.length === 0) {
      toast.error("Please add at least one section");
      return;
    }

    if (!formData.duration || parseInt(formData.duration) <= 0) {
      toast.error("Please enter a valid duration");
      return;
    }

    setIsSubmitting(true);
    const counsellorId = user.phoneNumber;

    let requestData: Record<string, unknown>;

    if (editMode && testSeriesId) {
      // For update, only send counsellorId, testSeriesId and changed fields
      requestData = {
        counsellorId,
        testSeriesId: testSeriesId,
      };

      // Only add fields that have changed
      if (existingTestData) {
        if (formData.name !== existingTestData.testName) {
          requestData.testName = formData.name;
        }
        if (formData.description !== existingTestData.testDescription) {
          requestData.testDescription = formData.description;
        }
        if (formData.stream !== existingTestData.stream) {
          requestData.stream = formData.stream;
        }
        if (sectionSwitchingAllowed !== existingTestData.sectionSwitchingAllowed) {
          requestData.sectionSwitchingAllowed = sectionSwitchingAllowed;
        }
        if (parseInt(formData.duration) !== existingTestData.durationInMinutes) {
          requestData.durationInMinutes = parseInt(formData.duration);
        }
        if (parseInt(formData.correctPoints) !== existingTestData.pointsForCorrectAnswer) {
          requestData.pointsForCorrectAnswer = parseInt(formData.correctPoints);
        }
        if (enableNegativeMarking !== existingTestData.negativeMarkingEnabled) {
          requestData.negativeMarkingEnabled = enableNegativeMarking;
        }
        const currentNegativeMarks = enableNegativeMarking ? parseFloat(formData.wrongPoints) : 0;
        if (currentNegativeMarks !== existingTestData.negativeMarks) {
          requestData.negativeMarks = currentNegativeMarks;
        }
        if (formData.instructions !== existingTestData.testInstructuctions) {
          requestData.testInstructuctions = formData.instructions;
        }

        // Check if test group changed
        const newTestGroupId = selectedTestGroupId || testGroupId;
        if (newTestGroupId !== existingTestData.testGroupId) {
          requestData.testGroupId = newTestGroupId;
        }

        // Include removed section names if any
        if (removedSectionNames.length > 0) {
          requestData.removedSectionName = removedSectionNames;
        }

        // Check if sections changed - compare stringified versions or include if any section has newSectionName
        const hasSectionChanges = sections.some(s => s.newSectionName) ||
          JSON.stringify(sections.map(s => ({
            sectionName: s.sectionName,
            totalQuestionsSupposedToBeAdded: s.totalQuestionsSupposedToBeAdded,
            sectionDurationInMinutes: s.sectionDurationInMinutes,
            pointsForCorrectAnswer: s.pointsForCorrectAnswer,
            negativeMarks: s.negativeMarks
          }))) !== JSON.stringify(existingTestData.listOfSection?.map((s: Section) => ({
            sectionName: s.sectionName,
            totalQuestionsSupposedToBeAdded: s.totalQuestionsSupposedToBeAdded,
            sectionDurationInMinutes: s.sectionDurationInMinutes,
            pointsForCorrectAnswer: s.pointsForCorrectAnswer,
            negativeMarks: s.negativeMarks
          })));

        if (hasSectionChanges) {
          requestData.sections = sections.map(section => ({
            sectionName: section.sectionName,
            totalQuestionsSupposedToBeAdded: section.totalQuestionsSupposedToBeAdded,
            sectionDurationInMinutes: section.sectionDurationInMinutes,
            pointsForCorrectAnswer: section.pointsForCorrectAnswer ?? 0,
            negativeMarks: section.negativeMarks ?? 0,
            ...(section.newSectionName ? { newSectionName: section.newSectionName } : {})
          }));
        }
      }
    } else {
      // For create, send all fields
      // Derive default scoring from first section (or use sensible defaults)
      const defaultCorrectPoints = sections[0]?.pointsForCorrectAnswer || 4;
      const hasNegativeMarking = sections.some(s => s.negativeMarks > 0);
      const defaultNegativeMarks = sections[0]?.negativeMarks || 0;

      requestData = {
        counsellorId,
        testName: formData.name,
        testDescription: formData.description,
        stream: formData.stream,
        testType: null,
        courseIdAttached: null,
        priceType: null,
        price: null,
        sectionSwitchingAllowed: sectionSwitchingAllowed,
        durationInMinutes: parseInt(formData.duration),
        pointsForCorrectAnswer: defaultCorrectPoints,
        negativeMarkingEnabled: hasNegativeMarking,
        negativeMarks: defaultNegativeMarks,
        testInstructuctions: formData.instructions,
        sections: sections,
        testGroupId: testGroupId,
      };
    }

    const myHeaders = new Headers();
    const token = localStorage.getItem("jwt");
    if (!token) {
      console.error("No authentication token found");
      toast.error("Authentication required. Please login again.");
      setIsSubmitting(false);
      return;
    }

    myHeaders.append("Authorization", `Bearer ${token}`);
    myHeaders.append("Accept", "application/json");

    const formdata = new FormData();
    formdata.append("request", JSON.stringify(requestData));
    if (file) {
      formdata.append("bannerImage", file);
    }

    const apiUrl = editMode
      ? `${import.meta.env.VITE_API_BASE_URL}/api/testSeries/updateTestSeries`
      : `${import.meta.env.VITE_API_BASE_URL}/api/testSeries/createTestSeries`;

    const requestOptions: RequestInit = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      redirect: "follow",
    };

    try {
      const response = await fetch(apiUrl, requestOptions);
      const result = await response.json();
      console.log(result);

      if (result.status && result.data?.testSeriesId) {
        const createdTestSeriesId = result.data.testSeriesId;

        if (editMode) {
          // For edit mode, invalidate cache and navigate back
          toast.success("Test series updated successfully!");
          // Invalidate the test series cache so it refetches only the updated data
          queryClient.invalidateQueries({ queryKey: ["counsellorTestSeries", user.phoneNumber] });
          setTimeout(() => {
            // Navigate back to test group details if testGroupId exists, otherwise go to dashboard
            if (testGroupId) {
              navigate(`/counselor/test-groups/${testGroupId}`, { replace: true });
            } else {
              navigate("/counsellor-dashboard", {
                state: { activeTab: "courses" },
                replace: true
              });
            }
          }, 600);
        } else {
          // For create mode, navigate to add question page
          toast.success("Test series created successfully! Add questions now.");
          navigate(`/add-question/${createdTestSeriesId}`, {
            state: { testGroupId },
            replace: true
          });
        }
      } else {
        toast.error(result.message || (editMode ? "Failed to update test series" : "Failed to create test series"));
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Check if form is valid for submission
  const isFormValid =
    formData.name.trim() &&
    formData.stream &&
    sections.length > 0 &&
    formData.duration &&
    parseInt(formData.duration) > 0 &&
    (editMode || file);

  return (
    <div className="pt-4 pb-8 w-full mx-auto max-w-7xl  min-h-screen flex flex-col gap-4">
      {/* Delete Section Confirmation Modal */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Section?</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-800 text-sm">
                <strong>Warning:</strong> Section "<strong>{deleteConfirmModal.sectionName}</strong>" has <strong>{deleteConfirmModal.questionCount}</strong> question{deleteConfirmModal.questionCount !== 1 ? 's' : ''} that will also be deleted.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Delete Section
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back button and title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            if (testGroupId) {
              navigate(`/counselor/test-groups/${testGroupId}`, { replace: true });
            } else {
              navigate("/counsellor-dashboard", {
                state: { activeTab: "courses" },
                replace: true
              });
            }
          }}
          className="flex items-center gap-2 text-(--text-app-primary) hover:text-(--btn-primary) transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">{testGroupId ? "Back to Test Group" : "Back to Test Groups"}</span>
        </button>
      </div>

      {/* top header title here */}
      <div className="p-5 bg-[#f8faf9] max-w-[1200px] text-(--text-app-primary) font-semibold text-[1.5rem] rounded-2xl">
        {editMode ? "Edit Test Series" : "Create New Test"}
      </div>

      <Dropdown label="Test Name" defaultOpen={true}>
        <div className="flex flex-col gap-4">
          <Input
            label="Test Name *"
            placeholder="eg . Physics test"
            value={formData.name}
            onChange={(value) => handleInputChange("name", value)}
          />
          <Textarea
            label="Description *"
            placeholder="eg. Explain what this test is about"
            value={formData.description}
            onChange={(value) => handleInputChange("description", value)}
          />
          <UploadBox
            file={file}
            setFile={setFile}
            existingImageUrl={existingBannerUrl}
            onImageSelect={(imageUrl) => {
              setImageToCrop(imageUrl);
              setShowCropper(true);
            }}
            required={true}
          />

          <div className="flex gap-2 flex-col">
            <label htmlFor={"stream"} className="text-[1rem] font-normal cursor-pointer">
              Stream *
            </label>
            <Select
              value={formData.stream}
              onValueChange={(value) => handleInputChange("stream", value)}
            >
              <SelectTrigger className="border border-[#13097D66] !py-3 !px-4 rounded-[12px] w-full text-[1rem] font-normal !h-auto cursor-pointer">
                <SelectValue
                  placeholder="Select stream"
                  className="placeholder:font-medium"
                />
              </SelectTrigger>
              <SelectContent>
                {STREAMS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-[1rem] font-medium cursor-pointer"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Test Group Selection - Only in Edit Mode */}
          {editMode && (
            <div className="flex gap-2 flex-col">
              <label htmlFor={"testGroup"} className="text-[1rem] font-normal cursor-pointer">
                Test Group
              </label>
              <Select
                value={selectedTestGroupId || ""}
                onValueChange={(value) => setSelectedTestGroupId(value)}
                disabled={isLoadingTestGroups}
              >
                <SelectTrigger className="border border-[#13097D66] !py-3 !px-4 rounded-[12px] w-full text-[1rem] font-normal !h-auto cursor-pointer">
                  <SelectValue
                    placeholder={isLoadingTestGroups ? "Loading test groups..." : "Select test group"}
                    className="placeholder:font-medium"
                  />
                </SelectTrigger>
                <SelectContent>
                  {allTestGroups.map((group) => (
                    <SelectItem
                      key={group.testGroupId}
                      value={group.testGroupId}
                      className="text-[1rem] font-medium cursor-pointer"
                    >
                      {group.testGroupName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </Dropdown>

      <Dropdown label="Sections">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Input
                label="Section Name *"
                placeholder="eg. Physics"
                value={currentSection.sectionName}
                onChange={(value) => handleSectionInputChange("sectionName", value)}
              />
            </div>
            <div>
              <Input
                label="Total Questions *"
                placeholder="eg. 25"
                value={currentSection.totalQuestions}
                onChange={(value) => handleSectionInputChange("totalQuestions", value)}
              />
            </div>
            <div>
              <Input
                label="Duration (minutes) *"
                placeholder="eg. 60 (max 600)"
                value={currentSection.sectionDuration}
                onChange={(value) => handleSectionInputChange("sectionDuration", value)}
                error={!!sectionErrors.sectionDuration}
                errorMessage={sectionErrors.sectionDuration}
              />
            </div>
            <div>
              <Input
                label="Points for Correct *"
                placeholder="eg. 4 (max 99.99)"
                value={currentSection.correctPoints}
                onChange={(value) => handleSectionInputChange("correctPoints", value)}
                error={!!sectionErrors.correctPoints}
                errorMessage={sectionErrors.correctPoints}
              />
            </div>
            <div>
              <Input
                label="Negative Marks *"
                placeholder="eg. 1 (max 99.99)"
                value={currentSection.negativeMarks}
                onChange={(value) => handleSectionInputChange("negativeMarks", value)}
                error={!!sectionErrors.negativeMarks}
                errorMessage={sectionErrors.negativeMarks}
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleAddSection}
                className="flex-1 flex items-center justify-center
                   py-2.5 px-4 bg-(--btn-primary)
                   text-white text-[1rem] font-medium
                   shadow-[0px_4px_12px_rgba(250,102,15,0.2)]
                   rounded-2xl hover:cursor-pointer"
              >
                {editingSectionIndex !== null ? "Update" : "Add"}
              </button>
            </div>
          </div>

          {sections.length > 0 && (
            <div className="flex flex-col gap-2 mt-4">
              <h3 className="text-[1rem] font-semibold text-(--text-app-primary)">Added Sections:</h3>
              {sections.map((section, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${editingSectionIndex === index ? 'bg-blue-50 border border-blue-200' : 'bg-[#f8faf9]'}`}>
                  <div className="grid grid-cols-5 gap-3 flex-1 items-center">
                    <span className="text-[0.875rem]"><strong className="inline-block w-14">Name:</strong> {section.newSectionName || section.sectionName}</span>
                    <span className="text-[0.875rem]"><strong className="inline-block w-20">Questions:</strong> {section.totalQuestionsSupposedToBeAdded}</span>
                    <span className="text-[0.875rem]"><strong className="inline-block w-18 px-1">Duration:</strong> {section.sectionDurationInMinutes} min</span>
                    <span className="text-[0.875rem]"><strong className="inline-block w-28">Correct Points:</strong> {section.pointsForCorrectAnswer}</span>
                    <span className="text-[0.875rem]"><strong className="inline-block w-32">Negative Marks:</strong> {section.negativeMarks}</span>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {editingSectionIndex === index ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelEdit();
                        }}
                        className="text-gray-500 hover:text-gray-700 font-medium cursor-pointer px-3 py-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditSection(index);
                        }}
                        className="text-blue-500 hover:text-blue-700 font-medium cursor-pointer px-3 py-1 hover:bg-blue-50 rounded transition-colors"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSection(index);
                      }}
                      className="text-red-500 hover:text-red-700 font-medium cursor-pointer px-3 py-1 hover:bg-red-50 rounded transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Dropdown>

      <Dropdown label="Test Settings">
        <div className="flex flex-col gap-4">
          <Checkbox
            label="Allow Section Switching"
            checked={sectionSwitchingAllowed}
            onChange={setSectionSwitchingAllowed}
          />
          <div>
            <label className="text-[1rem] font-normal mb-2 block">
              Duration (in minutes) * <span className="text-(--text-muted) text-sm">(Auto-calculated from sections)</span>
            </label>
            <input
              type="text"
              value={formData.duration || "0"}
              readOnly
              className="border border-[#13097D66] bg-gray-50 py-3 px-4 rounded-[12px] w-full placeholder:text-(--text-muted) placeholder:font-medium cursor-not-allowed"
              placeholder="Add sections to calculate duration"
            />
          </div>
        </div>
      </Dropdown>

      <div className=" w-full bg-white shadow-[0_0_4px_0_#00000026] hover:cursor-pointer rounded-2xl p-5 max-w-[1200px] flex flex-col gap-4">
        <div className="flex gap-10">
          <h1 className="text-(--text-app-primary) font-medium text-[1.125rem]">
            Test Name:{" "}
            <span className="text-(--text-muted)">
              {formData.name ? formData.name : "Not set"}
            </span>
          </h1>
          <h1 className="text-(--text-app-primary) font-medium text-[1.125rem]">
            Total Section: <span className="text-(--text-muted)">{sections.length}</span>
          </h1>
          <h1 className="text-(--text-app-primary) font-medium text-[1.125rem]">
            Duration: <span className="text-(--text-muted)">{formData.duration || "0"} minutes</span>
          </h1>
        </div>

        <div className="flex gap-6 justify-end">
          <button
            onClick={handleSaveDraft}
            disabled={isSubmitting || !isFormValid}
            className="mt-6 flex items-center justify-center gap-2
               py-2.5 px-10 bg-(--btn-primary)
               text-white text-[1rem] font-medium
               shadow-[0px_4px_12px_rgba(250,102,15,0.2)]
               rounded-2xl whitespace-nowrap hover:cursor-pointer
               disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {editMode ? "Updating Test..." : "Creating Test..."}
              </>
            ) : (
              editMode ? "Update Test" : "Next: Upload Question"
            )}
          </button>
        </div>
      </div>

      {/* Image Cropper Modal */}
      {showCropper && imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          aspectRatio={1}
          onCropComplete={(croppedImage) => {
            setFile(croppedImage);
            setExistingBannerUrl(URL.createObjectURL(croppedImage));
            setShowCropper(false);
            setImageToCrop(null);
          }}
          onCancel={() => {
            // Clear the temporary image selection
            setShowCropper(false);
            setImageToCrop(null);
            // Don't set file or banner URL on cancel
          }}
        />
      )}
    </div>
  );
}


