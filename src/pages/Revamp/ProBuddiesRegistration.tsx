import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import type { DragEvent, ChangeEvent, FormEvent, MouseEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/AuthStore";
import { ImageCropper } from "@/components/common/ImageCropper";
import {
  registerProBuddy,
  uploadProBuddyPhoto,
  uploadProBuddyIdCardPhoto,
} from "@/api/pro-buddies";

// New college search API types
interface CollegeSearchResult {
  id: number;
  college_name: string;
  university_name: string;
  state: string;
  district: string;
  college_type: string | null;
  university_type: string | null;
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png"];
const OFFERING_LIMITS = { min: 0, max: 10 } as const;
const YEAR_OPTIONS = [
  { value: "1", label: "1st" },
  { value: "2", label: "2nd" },
  { value: "3", label: "3rd" },
  { value: "4", label: "4th" },
  { value: "5", label: "5th" },
] as const;

const isAcceptedImage = (file: File) => ACCEPTED_IMAGE_TYPES.includes(file.type);

export default function ProBuddiesRegistration() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileCropImage, setProfileCropImage] = useState<string | null>(null);

  const [idCardPreviewUrl, setIdCardPreviewUrl] = useState<string | null>(null);
  const [selectedIdCard, setSelectedIdCard] = useState<File | null>(null);
  const idCardInputRef = useRef<HTMLInputElement>(null);
  const [idCardCropImage, setIdCardCropImage] = useState<string | null>(null);

  const [isYearsOpen, setIsYearsOpen] = useState(false);
  const yearsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      if (yearsRef.current && !yearsRef.current.contains(e.target as Node)) {
        setIsYearsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const [collegeSearch, setCollegeSearch] = useState("");
  const [isCollegeDropdownOpen, setIsCollegeDropdownOpen] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<CollegeSearchResult | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Handle college search with debounce
  const handleCollegeSearchChange = useCallback((value: string) => {
    setCollegeSearch(value);
    setIsCollegeDropdownOpen(true);
    setSelectedCollege(null);
    setFormData((prev) => ({
      ...prev,
      institution: "",
      location: "",
    }));

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Only set debounced query if input is >= 3 characters
    if (value.trim().length >= 3) {
      debounceTimerRef.current = setTimeout(() => {
        setDebouncedSearchQuery(value.trim());
      }, 500); // 500ms debounce
    } else {
      setDebouncedSearchQuery("");
    }
  }, []);

  // Fetch colleges from search API with debounced query
  const { data: colleges = [], isLoading: isCollegesLoading } = useQuery({
    queryKey: ["college-search", debouncedSearchQuery],
    queryFn: async () => {
      if (!debouncedSearchQuery || debouncedSearchQuery.length < 3) {
        return [];
      }
      const response = await fetch(
        `https://college-search-api.vercel.app/search?q=${encodeURIComponent(debouncedSearchQuery)}&limit=20`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch colleges");
      }
      const data = await response.json();
      return data.results || [];
    },
    enabled: debouncedSearchQuery.length >= 3,
    staleTime: 5 * 60 * 1000,
  });

  const filteredColleges = useMemo(() => colleges, [colleges]);

  const handleSelectCollege = (college: CollegeSearchResult) => {
    setSelectedCollege(college);
    setCollegeSearch(college.college_name);
    setIsCollegeDropdownOpen(false);
    setFormData((prev) => ({
      ...prev,
      institution: college.college_name,
      location: college.state,
    }));
  };

  const clearCollegeSelection = () => {
    setSelectedCollege(null);
    setCollegeSearch("");
    setIsCollegeDropdownOpen(false);
    setDebouncedSearchQuery("");
    setFormData((prev) => ({
      ...prev,
      institution: "",
      location: "",
    }));
  };

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
    location: "",
    institution: "",
    degree: "",
    course: "",
    years: "",
    specialization: "",
    subHeading: "",
    aboutMe: "",
    whyConnect: "",
    languagesKnow: "Hindi, English",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    officeStartTime: "09:00",
    officeEndTime: "18:00",
    ratePerMinute: "",
    messFood: "",
    attendance: "",
    campusVibe: "",
    facultyQuality: "",
    examStrategy: "",
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const normalizeOfferingValue = (value: string) => {
    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue)) {
      return OFFERING_LIMITS.max;
    }

    return Math.min(OFFERING_LIMITS.max, Math.max(OFFERING_LIMITS.min, parsedValue));
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      if (idCardPreviewUrl) {
        URL.revokeObjectURL(idCardPreviewUrl);
      }

      if (profileCropImage) {
        URL.revokeObjectURL(profileCropImage);
      }

      if (idCardCropImage) {
        URL.revokeObjectURL(idCardCropImage);
      }

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [previewUrl, idCardPreviewUrl, profileCropImage, idCardCropImage]);

  const setProfilePreview = (file: File) => {
    if (!isAcceptedImage(file)) {
      toast.error("Please upload a valid PNG or JPEG image.");
      return;
    }

    if (profileCropImage) {
      URL.revokeObjectURL(profileCropImage);
    }

    setProfileCropImage(URL.createObjectURL(file));
  };

  const setIdCardPreview = (file: File) => {
    if (!isAcceptedImage(file)) {
      toast.error("Please upload a valid PNG or JPEG image for your ID Card.");
      return;
    }

    if (idCardCropImage) {
      URL.revokeObjectURL(idCardCropImage);
    }

    setIdCardCropImage(URL.createObjectURL(file));
  };

  const toggleDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day]
    }));
  };

  const handleFile = (file: File) => {
    setProfilePreview(file);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const removeImage = (e: MouseEvent) => {
    e.stopPropagation();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleIdCardFile = (file: File) => {
    setIdCardPreview(file);
  };

  const onIdCardChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleIdCardFile(e.target.files[0]);
    }
  };

  const onIdCardDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleIdCardFile(e.dataTransfer.files[0]);
    }
  };

  const removeIdCard = (e: MouseEvent) => {
    e.stopPropagation();
    if (idCardPreviewUrl) {
      URL.revokeObjectURL(idCardPreviewUrl);
    }
    setIdCardPreviewUrl(null);
    setSelectedIdCard(null);
    if (idCardInputRef.current) {
      idCardInputRef.current.value = "";
    }
  };

  const handleProfileCropComplete = (croppedImage: File) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const nextPreview = URL.createObjectURL(croppedImage);
    setPreviewUrl(nextPreview);
    setSelectedImage(croppedImage);

    if (profileCropImage) {
      URL.revokeObjectURL(profileCropImage);
    }

    setProfileCropImage(null);
  };

  const handleProfileCropCancel = () => {
    if (profileCropImage) {
      URL.revokeObjectURL(profileCropImage);
    }

    setProfileCropImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleIdCardCropComplete = (croppedImage: File) => {
    if (idCardPreviewUrl) {
      URL.revokeObjectURL(idCardPreviewUrl);
    }

    const nextPreview = URL.createObjectURL(croppedImage);
    setIdCardPreviewUrl(nextPreview);
    setSelectedIdCard(croppedImage);

    if (idCardCropImage) {
      URL.revokeObjectURL(idCardCropImage);
    }

    setIdCardCropImage(null);
  };

  const handleIdCardCropCancel = () => {
    if (idCardCropImage) {
      URL.revokeObjectURL(idCardCropImage);
    }

    setIdCardCropImage(null);
    if (idCardInputRef.current) {
      idCardInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    const location = formData.location.trim();
    const collegeName = selectedCollege?.college_name || formData.institution.trim();

    if (!firstName || !lastName || !location || !selectedCollege) {
      toast.error("Please fill in all required fields and select a college.");
      return;
    }

    if (!selectedIdCard) {
      toast.error("Please upload your ID Card.");
      return;
    }

    const payload = {
      firstName,
      lastName,
      phoneNumber: formData.phoneNumber.trim(),
      email: formData.email.trim(),
      collegeName,
      collegeId: selectedCollege?.id ? String(selectedCollege.id) : null,
      currentYear: formData.years,
      course: `${formData.degree} ${formData.course}`.trim(),
      city: selectedCollege.district || location,
      state: selectedCollege.state || location,
      collegeData: {
        name: selectedCollege.college_name,
        universityName: selectedCollege.university_name,
        state: selectedCollege.state,
        district: selectedCollege.district,
        collegeType: selectedCollege.college_type,
        universityType: selectedCollege.university_type,
      },
      whoShouldConnect: formData.whyConnect,
      aboutMe: {
        heading: formData.specialization,
        subHeading: formData.subHeading || "ProBuddy",
        aboutMe: formData.aboutMe
      },
      ratePerMinute: formData.ratePerMinute.trim() === "" ? null : Number(formData.ratePerMinute),
      offerings: {
        "Mess Food": normalizeOfferingValue(formData.messFood),
        "Attendance": normalizeOfferingValue(formData.attendance),
        "Campus Vibe": normalizeOfferingValue(formData.campusVibe),
        "Faculty Quality": normalizeOfferingValue(formData.facultyQuality),
        "Exam Strategy": normalizeOfferingValue(formData.examStrategy),
      },
      languagesKnow: formData.languagesKnow.split(",").map(l => l.trim()),
      workingDays: formData.workingDays,
      officeStartTime: formData.officeStartTime,
      officeEndTime: formData.officeEndTime
    };

    try {
      setLoading(true);
      
      // Step 1: Register ProBuddy with payload
      const regResponse = await registerProBuddy(payload);
      const newBuddyId = regResponse.id || regResponse.proBuddyId || regResponse.data?.id || regResponse.data?.proBuddyId || payload?.phoneNumber;

      if (!newBuddyId) {
        throw new Error("Failed to get ProBuddy ID from registration response");
      }

      // Step 2: Upload ID Card and Profile Photo in parallel (after registration)
      // Both are non-blocking - can be uploaded later if they fail
      const uploadPromises = [];
      
      if (selectedIdCard) {
        uploadPromises.push(
          uploadProBuddyIdCardPhoto(String(newBuddyId), selectedIdCard)
            .catch(err => {
              console.warn("ID Card upload failed (non-critical):", err);
              toast.error("ID Card upload failed - you can update it later in profile settings");
              return null;
            })
        );
      }

      if (selectedImage) {
        uploadPromises.push(
          uploadProBuddyPhoto(String(newBuddyId), selectedImage)
            .catch(err => {
              console.warn("Profile photo upload failed (non-critical):", err);
              toast.error("Profile photo upload failed - you can update it later in profile settings");
              return null;
            })
        );
      }

      // Wait for all uploads (non-blocking - don't throw if they fail)
      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
      }

      // Update auth state
      if (regResponse.jwtToken) {
        localStorage.setItem("jwt", regResponse.jwtToken);
      }
      localStorage.setItem("role", "proBuddy");
      useAuthStore.setState({ role: "proBuddy" });
      await useAuthStore.getState().refreshUser(true);

      // Show success message
      toast.success("Registration completed successfully! You can update photos anytime in profile settings.");
      navigate("/pro-buddies/dashboard");
    } catch (error: unknown) {
      console.error("Signup error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="w-full min-h-screen bg-[#C6DDF040] pb-20 flex flex-col items-center gap-[24px] px-4 sm:px-6 lg:px-8">

      <div className="w-full max-w-[1200px] h-auto bg-white rounded-[8px] mt-[24px] sm:mt-[40px] p-4 sm:p-[24px] box-border">
        
        <div className="flex items-center gap-[10px] mb-[12px]">
          <div className="w-[24px] h-[24px] rounded-[12px] bg-[#2F43F2] flex items-center justify-center">
            <span className="text-white text-[14px] font-semibold font-sans leading-none">1</span>
          </div>
          <h2 
            className="text-[#0E1629] text-[20px] font-semibold leading-[100%]"
            style={{ fontFamily: 'Poppins' }}
          >
            Personal Information
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-[120px] mb-[12px]">
          <div className="flex flex-col gap-[14px] w-full h-auto">
            <label 
              htmlFor="firstName" 
              className="text-[#0E1629] text-[14px] font-semibold leading-[125%]"
              style={{ fontFamily: 'Poppins' }}
            >
              First Name*
            </label>
            <input 
              type="text" 
              id="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
              placeholder="Enter your First Name as per Aadhar"
              className="w-full h-[36px] px-[12px] border border-gray-200 rounded-[4px] outline-none focus:border-[#2F43F2] text-[#0E1629] text-[14px] placeholder:text-[#6B728080] placeholder:text-[12px]"
              style={{ fontFamily: 'Poppins' }}
            />
          </div>

          <div className="flex flex-col gap-[14px] w-full h-auto">
            <label 
              htmlFor="lastName" 
              className="text-[#0E1629] text-[14px] font-semibold leading-[125%]"
              style={{ fontFamily: 'Poppins' }}
            >
              Last Name*
            </label>
            <input 
              type="text" 
              id="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
              placeholder="Enter your Last Name as per Aadhar"
              className="w-full h-[36px] px-[12px] border border-gray-200 rounded-[4px] outline-none focus:border-[#2F43F2] text-[#0E1629] text-[14px] placeholder:text-[#6B728080] placeholder:text-[12px]"
              style={{ fontFamily: 'Poppins' }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-[120px] mb-[12px]">
          <div className="flex flex-col gap-[14px] w-full h-auto">
            <label 
              htmlFor="email" 
              className="text-[#0E1629] text-[14px] font-semibold leading-[125%]"
              style={{ fontFamily: 'Poppins' }}
            >
              Email*
            </label>
            <input 
              type="email" 
              id="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="Enter your email address"
              className="w-full h-[36px] px-[12px] border border-gray-200 rounded-[4px] outline-none focus:border-[#2F43F2] text-[#0E1629] text-[14px] placeholder:text-[#6B728080] placeholder:text-[12px]"
              style={{ fontFamily: 'Poppins' }}
            />
          </div>

          <div className="flex flex-col gap-[14px] w-full h-auto">
            <label 
              htmlFor="phoneNumber" 
              className="text-[#0E1629] text-[14px] font-semibold leading-[125%]"
              style={{ fontFamily: 'Poppins' }}
            >
              Phone Number*
            </label>
            <input 
              type="tel" 
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              required
              placeholder="Enter your phone number"
              className="w-full h-[36px] px-[12px] border border-gray-200 rounded-[4px] outline-none focus:border-[#2F43F2] text-[#0E1629] text-[14px] placeholder:text-[#6B728080] placeholder:text-[12px]"
              style={{ fontFamily: 'Poppins' }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-[120px] mb-[12px]">
          <div className="flex flex-col gap-[14px] w-full h-auto">
            <label 
              htmlFor="location" 
              className="text-[#0E1629] text-[14px] font-semibold leading-[125%]"
              style={{ fontFamily: 'Poppins' }}
            >
              Location*
            </label>
            <input 
              type="text" 
              id="location"
              value={formData.location}
              onChange={handleInputChange}
              required
              placeholder="Enter your city, state (you can edit after selecting college)"
              className="w-full h-[36px] px-[12px] border border-gray-200 rounded-[4px] outline-none text-[#0E1629] text-[14px] placeholder:text-[#6B728080] placeholder:text-[12px]"
              style={{ fontFamily: 'Poppins' }}
            />
          </div>

          <div className="flex flex-col gap-[14px] w-full h-auto">
            <label className="text-transparent text-[14px] font-semibold leading-[125%]" style={{ fontFamily: 'Poppins' }}>
              &nbsp;
            </label>
            <p className="pt-[10px] text-[12px] text-[#6B7280]" style={{ fontFamily: 'Poppins' }}>
              This is auto-filled from the selected college's state-province; you can edit it.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-[120px] mb-[12px]">
          
          {/* Profile Photo Column */}
          <div className="flex flex-col gap-[12px] w-full h-auto min-h-[152px]">
            <label 
              className="text-[#0E1629] text-[14px] font-semibold leading-[125%]"
              style={{ fontFamily: 'Poppins' }}
            >
              Profile Photo
            </label>
            
            <div 
              className="relative w-full h-[120px] rounded-[4px] border-[1px] border-dashed border-[#EBEBEB] bg-[#6B72800A] flex flex-col items-center justify-center gap-[8px] cursor-pointer hover:bg-[#6b728013] transition-colors overflow-hidden"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={onDragOver}
              onDrop={onDrop}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg"
                onChange={onFileChange}
              />

              {previewUrl ? (
                <>
                  <img loading="lazy" decoding="async" 
                    src={previewUrl} 
                    alt="Profile Preview" 
                    className="w-full h-full object-contain bg-white" 
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-[8px] right-[8px] w-[24px] h-[24px] bg-red-500 cursor-pointer rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                    aria-label="Remove image"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </>
              ) : (
                <>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12H19" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span 
                    className="text-[#6B7280] text-[12px] leading-[125%]"
                    style={{ fontFamily: 'Poppins' }}
                  >
                    Click to upload or drag and drop
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-[12px] w-full h-auto min-h-[152px]">
            <label 
              className="text-[#0E1629] text-[14px] font-semibold leading-[125%]"
              style={{ fontFamily: 'Poppins' }}
            >
              Upload ID Card*
            </label>
            
            <div 
              className="relative w-full h-[120px] rounded-[4px] border-[1px] border-dashed border-[#EBEBEB] bg-[#6B72800A] flex flex-col items-center justify-center gap-[8px] cursor-pointer hover:bg-[#6b728013] transition-colors overflow-hidden"
              onClick={() => idCardInputRef.current?.click()}
              onDragOver={onDragOver}
              onDrop={onIdCardDrop}
            >
              <input 
                type="file" 
                ref={idCardInputRef}
                className="hidden"
                accept="image/png, image/jpeg"
                onChange={onIdCardChange}
              />

              {idCardPreviewUrl ? (
                <>
                  <img loading="lazy" decoding="async" 
                    src={idCardPreviewUrl} 
                    alt="ID Card Preview" 
                    className="w-full h-full object-contain bg-white" 
                  />
                  <button
                    type="button"
                    onClick={removeIdCard}
                    className="absolute top-[8px] right-[8px] w-[24px] h-[24px] bg-red-500 cursor-pointer rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                    aria-label="Remove ID Card"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </>
              ) : (
                <>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12H19" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span 
                    className="text-[#6B7280] text-[12px] leading-[125%]"
                    style={{ fontFamily: 'Poppins' }}
                  >
                    Click to upload or drag and drop
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

      </div>

      <div className="w-full max-w-[1200px] h-auto bg-white rounded-[8px] p-4 sm:p-[24px] box-border flex flex-col gap-[24px]">
        
        <div className="flex items-center gap-[10px]">
          <div className="w-[24px] h-[24px] rounded-[12px] bg-[#2F43F2] flex items-center justify-center">
            <span className="text-white text-[14px] font-semibold font-sans leading-none">2</span>
          </div>
          <h2 
            className="text-[#0E1629] text-[20px] font-semibold leading-[100%]"
            style={{ fontFamily: 'Poppins' }}
          >
            Academic Details
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-[120px]">
          <div className="flex flex-col gap-[14px] w-full relative">
            <div className="flex items-center justify-between gap-[12px]">
              <label 
                htmlFor="collegeSearch" 
                className="text-[#0E1629] text-[14px] font-semibold leading-[125%]"
                style={{ fontFamily: 'Poppins' }}
              >
                Institution / College*
              </label>

              {selectedCollege ? (
                <button
                  type="button"
                  onClick={clearCollegeSelection}
                  className="text-[12px] font-medium text-[#2F43F2]"
                  style={{ fontFamily: 'Poppins' }}
                >
                  Clear selection
                </button>
              ) : null}
            </div>

            <div className="relative">
              <input
                type="text"
                id="collegeSearch"
                value={collegeSearch}
                onChange={(e) => handleCollegeSearchChange(e.target.value)}
                onFocus={() => setIsCollegeDropdownOpen(true)}
                onBlur={() => window.setTimeout(() => setIsCollegeDropdownOpen(false), 150)}
                placeholder="Search by college name, country, state, or domain"
                className="w-full h-[36px] px-[12px] pr-[72px] border border-gray-200 rounded-[4px] outline-none focus:border-[#2F43F2] text-[#0E1629] text-[14px] placeholder:text-[#6B728080] placeholder:text-[12px]"
                style={{ fontFamily: 'Poppins' }}
              />

              <div className="pointer-events-none absolute right-[12px] top-[9px] text-[12px] text-[#6B7280]">
                {isCollegesLoading ? "Loading..." : `${filteredColleges.length} results`}
              </div>

              {isCollegeDropdownOpen ? (
                <div className="absolute left-0 right-0 top-[44px] z-20 max-h-[280px] overflow-auto rounded-[12px] border border-[#E5E7EB] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.12)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {filteredColleges.length === 0 ? (
                    <div className="px-[16px] py-[14px] text-[13px] text-[#6B7280]" style={{ fontFamily: 'Poppins' }}>
                      No colleges match your search.
                    </div>
                  ) : (
                    filteredColleges.map((college) => {
                      const collegeLocation = college.state;

                      return (
                        <button
                          key={college.id}
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            handleSelectCollege(college);
                          }}
                          className="flex w-full items-center gap-[12px] border-b border-[#F3F4F6] px-[16px] py-[12px] text-left transition-colors last:border-b-0 hover:bg-[#F8FAFF]"
                        >
                          <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#F3F4F6]">
                            <span className="text-[12px] font-semibold text-[#64748B]" style={{ fontFamily: 'Poppins' }}>
                              {college.college_name.slice(0, 2).toUpperCase()}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-[12px]">
                              <div className="min-w-0">
                                <p className="truncate text-[14px] font-semibold text-[#0E1629]" style={{ fontFamily: 'Poppins' }}>
                                  {college.college_name}
                                </p>
                                <p className="truncate text-[12px] text-[#6B7280]" style={{ fontFamily: 'Poppins' }}>
                                  {collegeLocation || "Location not available"}
                                </p>
                              </div>

                              <span className="shrink-0 rounded-full bg-[#EEF2FF] px-[10px] py-[4px] text-[11px] font-medium text-[#2F43F2]" style={{ fontFamily: 'Poppins' }}>
                                {college.college_type || "College"}
                              </span>
                            </div>

                            <div className="mt-[8px] flex flex-wrap gap-[8px] text-[11px] text-[#475569]" style={{ fontFamily: 'Poppins' }}>
                              {college.state ? <span className="rounded-full bg-[#F8FAFC] px-[8px] py-[3px]">{college.state}</span> : null}
                              {college.district ? <span className="rounded-full bg-[#F8FAFC] px-[8px] py-[3px]">{college.district}</span> : null}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              ) : null}
            </div>

            <p className="text-[12px] text-[#6B7280]" style={{ fontFamily: 'Poppins' }}>
              Choose a college  City and state are copied automatically.
            </p>
          </div>

          <div className="flex flex-col gap-[14px] w-full">
            <label 
              htmlFor="degree" 
              className="text-[#0E1629] text-[14px] font-semibold leading-[125%]"
              style={{ fontFamily: 'Poppins' }}
            >
              Degree
            </label>
            <input 
              type="text" 
              id="degree"
              value={formData.degree}
              onChange={handleInputChange}
              placeholder="e.g., B.Tech"
              className="w-full h-[36px] px-[12px] border border-gray-200 rounded-[4px] outline-none focus:border-[#2F43F2] text-[#0E1629] text-[14px] placeholder:text-[#6B728080] placeholder:text-[12px]"
              style={{ fontFamily: 'Poppins' }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-[120px]">
          <div className="flex flex-col gap-[14px] w-full">
            <label 
              htmlFor="course" 
              className="text-[#0E1629] text-[14px] font-semibold leading-[125%]"
              style={{ fontFamily: 'Poppins' }}
            >
              Course/Major
            </label>
            <input 
              type="text" 
              id="course"
              value={formData.course}
              onChange={handleInputChange}
              placeholder="e.g., Computer Science Engineering"
              className="w-full h-[36px] px-[12px] border border-gray-200 rounded-[4px] outline-none focus:border-[#2F43F2] text-[#0E1629] text-[14px] placeholder:text-[#6B728080] placeholder:text-[12px]"
              style={{ fontFamily: 'Poppins' }}
            />
          </div>

          <div className="flex flex-col gap-[14px] w-full">
            <label
              className="text-[#0E1629] text-[14px] font-semibold leading-[125%]"
              style={{ fontFamily: 'Poppins' }}
            >
              Years of study
            </label>
            <div className="relative w-full" ref={yearsRef}>
              <button
                type="button"
                onClick={() => setIsYearsOpen((prev) => !prev)}
                className={`w-full h-[36px] px-[12px] pr-[36px] border rounded-[4px] outline-none text-left text-[14px] bg-white cursor-pointer ${isYearsOpen ? 'border-[#2F43F2]' : 'border-gray-200'}`}
                style={{ fontFamily: 'Poppins' }}
              >
                <span className={formData.years ? 'text-[#0E1629]' : 'text-[#6B728080] text-[12px]'}>
                  {formData.years ? `${YEAR_OPTIONS.find((option) => option.value === formData.years)?.label || formData.years} Year` : 'Select Year'}
                </span>
              </button>
              <div className="absolute right-[12px] top-[10px] pointer-events-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9L12 15L18 9" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              {isYearsOpen && (
                <div className="absolute left-0 right-0 top-[40px] z-50 overflow-hidden rounded-[8px] border border-gray-200 bg-white shadow-lg">
                  {YEAR_OPTIONS.map((year) => (
                    <button
                      key={year.value}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setFormData((prev) => ({ ...prev, years: year.value }));
                        setIsYearsOpen(false);
                      }}
                      className={`w-full px-[12px] py-[9px] text-left text-[14px] transition-colors hover:bg-[#F8FAFF] ${formData.years === year.value ? 'font-semibold text-[#2F43F2]' : 'text-[#0E1629]'}`}
                      style={{ fontFamily: 'Poppins' }}
                    >
                      {year.label} Year
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-[16px] border border-[#E5E7EB] bg-[#F8FAFC] p-[18px] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          {selectedCollege ? (
            <>
              <div className="flex flex-col gap-[16px] lg:flex-row lg:items-start">
                <div className="h-[96px] w-full shrink-0 overflow-hidden rounded-[12px] bg-[#E2E8F0] lg:w-[180px] flex items-center justify-center">
                  <span className="text-[28px] font-semibold text-[#64748B]" style={{ fontFamily: 'Poppins' }}>
                    {selectedCollege.college_name.slice(0, 2).toUpperCase()}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-[8px]">
                    <h3 className="min-w-0 text-[18px] font-semibold text-[#0E1629]" style={{ fontFamily: 'Poppins' }}>
                      {selectedCollege.college_name}
                    </h3>
                    {selectedCollege.college_type ? (
                      <span className="rounded-full bg-[#EEF2FF] px-[10px] py-[4px] text-[11px] font-medium text-[#2F43F2]" style={{ fontFamily: 'Poppins' }}>
                        {selectedCollege.college_type}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-[4px] text-[13px] text-[#475569]" style={{ fontFamily: 'Poppins' }}>
                    {selectedCollege.state || "Location not available"}
                  </p>

                  <div className="mt-[12px] flex flex-wrap gap-[8px] text-[12px]" style={{ fontFamily: 'Poppins' }}>
                    {selectedCollege.state ? <span className="rounded-full bg-white px-[10px] py-[5px] text-[#334155]">State: {selectedCollege.state}</span> : null}
                    {selectedCollege.district ? <span className="rounded-full bg-white px-[10px] py-[5px] text-[#334155]">District: {selectedCollege.district}</span> : null}
                    {selectedCollege.university_name ? <span className="rounded-full bg-white px-[10px] py-[5px] text-[#334155]">University: {selectedCollege.university_name}</span> : null}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-[12px] border border-dashed border-[#CBD5E1] bg-white px-[16px] py-[18px] text-[13px] text-[#64748B]" style={{ fontFamily: 'Poppins' }}>
              Search and select a college to auto-fill the registration details.
            </div>
          )}
        </div>

      </div>

      <div className="w-full max-w-[1200px] h-auto bg-white rounded-[8px] p-4 sm:p-[24px] box-border flex flex-col gap-[24px]">
        
        <div className="flex items-center gap-[10px]">
          <div className="w-[24px] h-[24px] rounded-[12px] bg-[#2F43F2] flex items-center justify-center">
            <span className="text-white text-[14px] font-semibold font-sans leading-none">3</span>
          </div>
          <h2 
            className="text-[#0E1629] text-[20px] font-semibold leading-[100%]"
            style={{ fontFamily: 'Poppins' }}
          >
            Career Focus & About you
          </h2>
        </div>

        <div className="flex flex-col gap-[14px] w-full">
          <label 
            htmlFor="specialization" 
            className="text-[#0E1629] text-[14px] font-semibold leading-[125%]"
            style={{ fontFamily: 'Poppins' }}
          >
            Career Specialization
          </label>
          <input 
            type="text" 
            id="specialization"
            value={formData.specialization}
            onChange={handleInputChange}
            placeholder="e.g., Career Transition strategy"
            className="w-full h-[36px] px-[12px] border border-gray-200 rounded-[4px] outline-none focus:border-[#2F43F2] text-[#0E1629] text-[14px] placeholder:text-[#6B728080] placeholder:text-[12px]"
            style={{ fontFamily: 'Poppins' }}
          />
        </div>
        <div className="flex flex-col gap-[14px] w-full">
          <label 
            htmlFor="subHeading" 
            className="text-[#0E1629] text-[14px] font-semibold leading-[125%]"
            style={{ fontFamily: 'Poppins' }}
          >
            Short Intro / Sub Heading
          </label>
          <input 
            type="text" 
            id="subHeading"
            value={formData.subHeading}
            onChange={handleInputChange}
            placeholder="e.g., 3rd year CSE, campus guide"
            className="w-full h-[36px] px-[12px] border border-gray-200 rounded-[4px] outline-none focus:border-[#2F43F2] text-[#0E1629] text-[14px] placeholder:text-[#6B728080] placeholder:text-[12px]"
            style={{ fontFamily: 'Poppins' }}
          />
        </div>

        <div className="flex flex-col gap-[14px] w-full">
          <label 
            htmlFor="aboutMe" 
            className="text-[#0E1629] text-[14px] font-semibold leading-[125%]"
            style={{ fontFamily: 'Poppins' }}
          >
            About You
          </label>
          <textarea 
            id="aboutMe"
            value={formData.aboutMe}
            onChange={handleInputChange}
            placeholder="Tell students about your journey, what you can help with, and why they should connect with you."
            rows={5}
            className="w-full px-[12px] py-[10px] border border-gray-200 rounded-[4px] outline-none focus:border-[#2F43F2] text-[#0E1629] text-[14px] placeholder:text-[#6B728080] placeholder:text-[12px] resize-none"
            style={{ fontFamily: 'Poppins' }}
          />
        </div>

        <div className="flex flex-col gap-[14px] w-full">
          <label
            htmlFor="whyConnect"
            className="text-[#0E1629] text-[14px] font-semibold leading-[125%]"
            style={{ fontFamily: 'Poppins' }}
          >
            Who Should Connect With You?
          </label>
          <textarea
            id="whyConnect"
            value={formData.whyConnect}
            onChange={handleInputChange}
            placeholder="Add the kind of students you can help most."
            rows={4}
            className="w-full px-[12px] py-[10px] border border-gray-200 rounded-[4px] outline-none focus:border-[#2F43F2] text-[#0E1629] text-[14px] placeholder:text-[#6B728080] placeholder:text-[12px] resize-none"
            style={{ fontFamily: 'Poppins' }}
          />
        </div>

      </div>

      <div className="w-full max-w-[1200px] h-auto bg-white rounded-[8px] p-4 sm:p-[24px] box-border flex flex-col gap-[24px]">
        
        <div className="flex items-center gap-[10px]">
          <div className="w-[24px] h-[24px] rounded-[12px] bg-[#2F43F2] flex items-center justify-center">
            <span className="text-white text-[14px] font-semibold font-sans leading-none">4</span>
          </div>
          <h2 
            className="text-[#0E1629] text-[20px] font-semibold leading-[100%]"
            style={{ fontFamily: 'Poppins' }}
          >
            Availability & Languages
          </h2>
        </div>

        <div className="flex flex-col gap-[14px] w-full">
          <label 
            htmlFor="languagesKnow" 
            className="text-[#0E1629] text-[14px] font-semibold leading-[125%]"
            style={{ fontFamily: 'Poppins' }}
          >
            Languages Known (Comma separated)
          </label>
          <input 
            type="text" 
            id="languagesKnow"
            value={formData.languagesKnow}
            onChange={handleInputChange}
            placeholder="e.g., Hindi, English"
            className="w-full h-[36px] px-[12px] border border-gray-200 rounded-[4px] outline-none focus:border-[#2F43F2] text-[#0E1629] text-[14px] placeholder:text-[#6B728080] placeholder:text-[12px]"
            style={{ fontFamily: 'Poppins' }}
          />
        </div>

        <div className="flex flex-col gap-[14px] w-full">
          <label 
            className="text-[#0E1629] text-[14px] font-semibold leading-[125%]"
            style={{ fontFamily: 'Poppins' }}
          >
            Working Days
          </label>
          <div className="flex gap-[16px] flex-wrap">
            {DAYS_OF_WEEK.map((day) => (
              <label key={day} className="flex items-center gap-[8px] cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.workingDays.includes(day)} 
                  onChange={() => toggleDay(day)} 
                  className="w-[16px] h-[16px] accent-[#2F43F2] cursor-pointer" 
                />
                <span 
                  className="text-[14px] text-[#0E1629]"
                  style={{ fontFamily: 'Poppins' }}
                >
                  {day}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-[120px]">
          <div className="flex flex-col gap-[14px] w-full">
            <label 
              htmlFor="ratePerMinute" 
              className="text-[#0E1629] text-[14px] font-semibold leading-[125%]"
              style={{ fontFamily: 'Poppins' }}
            >
              Rate Per Minute
            </label>
            <input 
              type="number" 
              id="ratePerMinute"
              min={0}
              step={1}
              value={formData.ratePerMinute}
              onChange={handleInputChange}
              placeholder="Enter your rate per minute"
              className="w-full h-[36px] px-[12px] border border-gray-200 rounded-[4px] outline-none focus:border-[#2F43F2] text-[#0E1629] text-[14px] placeholder:text-[#6B728080] placeholder:text-[12px]"
              style={{ fontFamily: 'Poppins' }}
            />
          </div>

          <div className="flex flex-col gap-[14px] w-full">
            <label 
              htmlFor="officeStartTime" 
              className="text-[#0E1629] text-[14px] font-semibold leading-[125%]"
              style={{ fontFamily: 'Poppins' }}
            >
              Available From (Time)
            </label>
            <input 
              type="time" 
              id="officeStartTime"
              value={formData.officeStartTime}
              onChange={handleInputChange}
              className="w-full h-[36px] px-[12px] border border-gray-200 rounded-[4px] outline-none focus:border-[#2F43F2] text-[#0E1629] text-[14px] placeholder:text-[#6B728080] placeholder:text-[12px]"
              style={{ fontFamily: 'Poppins' }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-[120px]">
          <div className="flex flex-col gap-[14px] w-full">
            <label 
              htmlFor="officeEndTime" 
              className="text-[#0E1629] text-[14px] font-semibold leading-[125%]"
              style={{ fontFamily: 'Poppins' }}
            >
              Available Until (Time)
            </label>
            <input 
              type="time" 
              id="officeEndTime"
              value={formData.officeEndTime}
              onChange={handleInputChange}
              className="w-full h-[36px] px-[12px] border border-gray-200 rounded-[4px] outline-none focus:border-[#2F43F2] text-[#0E1629] text-[14px] placeholder:text-[#6B728080] placeholder:text-[12px]"
              style={{ fontFamily: 'Poppins' }}
            />
          </div>
        </div>

      </div>

      <div className="w-full max-w-[1200px] h-auto bg-white rounded-[8px] p-4 sm:p-[24px] box-border flex flex-col gap-[24px]">
        
        <div className="flex items-center gap-[10px]">
          <div className="w-[24px] h-[24px] rounded-[12px] bg-[#2F43F2] flex items-center justify-center">
            <span className="text-white text-[14px] font-semibold font-sans leading-none">5</span>
          </div>
          <h2 
            className="text-[#0E1629] text-[20px] font-semibold leading-[100%]"
            style={{ fontFamily: 'Poppins' }}
          >
            College Life at {selectedCollege?.name || "Selected College"}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-[120px]">
          <div className="flex flex-col gap-[14px] w-full">
            <label 
              htmlFor="messFood" 
              className="text-[#0E1629] text-[14px] font-semibold leading-[125%]"
              style={{ fontFamily: 'Poppins' }}
            >
              Mess Food
            </label>
            <input 
              type="number" 
              id="messFood"
              min={OFFERING_LIMITS.min}
              max={OFFERING_LIMITS.max}
              step={1}
              value={formData.messFood}
              onChange={handleInputChange}
              placeholder="Rate 0 to 10"
              className="w-full h-[36px] px-[12px] border border-gray-200 rounded-[4px] outline-none focus:border-[#2F43F2] text-[#0E1629] text-[14px] placeholder:text-[#6B728080] placeholder:text-[12px]"
              style={{ fontFamily: 'Poppins' }}
            />
          </div>

          <div className="flex flex-col gap-[14px] w-full">
            <label 
              htmlFor="attendance" 
              className="text-[#0E1629] text-[14px] font-semibold leading-[125%]"
              style={{ fontFamily: 'Poppins' }}
            >
              Attendance
            </label>
            <input 
              type="number" 
              id="attendance"
              min={OFFERING_LIMITS.min}
              max={OFFERING_LIMITS.max}
              step={1}
              value={formData.attendance}
              onChange={handleInputChange}
              placeholder="Rate 0 to 10"
              className="w-full h-[36px] px-[12px] border border-gray-200 rounded-[4px] outline-none focus:border-[#2F43F2] text-[#0E1629] text-[14px] placeholder:text-[#6B728080] placeholder:text-[12px]"
              style={{ fontFamily: 'Poppins' }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-[120px]">
          <div className="flex flex-col gap-[14px] w-full">
            <label 
              htmlFor="campusVibe" 
              className="text-[#0E1629] text-[14px] font-semibold leading-[125%]"
              style={{ fontFamily: 'Poppins' }}
            >
              Campus Vibe
            </label>
            <input 
              type="number" 
              id="campusVibe"
              min={OFFERING_LIMITS.min}
              max={OFFERING_LIMITS.max}
              step={1}
              value={formData.campusVibe}
              onChange={handleInputChange}
              placeholder="Rate 0 to 10"
              className="w-full h-[36px] px-[12px] border border-gray-200 rounded-[4px] outline-none focus:border-[#2F43F2] text-[#0E1629] text-[14px] placeholder:text-[#6B728080] placeholder:text-[12px]"
              style={{ fontFamily: 'Poppins' }}
            />
          </div>

          <div className="flex flex-col gap-[14px] w-full">
            <label 
              htmlFor="facultyQuality" 
              className="text-[#0E1629] text-[14px] font-semibold leading-[125%]"
              style={{ fontFamily: 'Poppins' }}
            >
              Faculty Quality
            </label>
            <input 
              type="number" 
              id="facultyQuality"
              min={OFFERING_LIMITS.min}
              max={OFFERING_LIMITS.max}
              step={1}
              value={formData.facultyQuality}
              onChange={handleInputChange}
              placeholder="Rate 0 to 10"
              className="w-full h-[36px] px-[12px] border border-gray-200 rounded-[4px] outline-none focus:border-[#2F43F2] text-[#0E1629] text-[14px] placeholder:text-[#6B728080] placeholder:text-[12px]"
              style={{ fontFamily: 'Poppins' }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-[120px]">
          <div className="flex flex-col gap-[14px] w-full">
            <label 
              htmlFor="examStrategy" 
              className="text-[#0E1629] text-[14px] font-semibold leading-[125%]"
              style={{ fontFamily: 'Poppins' }}
            >
              Exam Strategy
            </label>
            <input 
              type="number" 
              id="examStrategy"
              min={OFFERING_LIMITS.min}
              max={OFFERING_LIMITS.max}
              step={1}
              value={formData.examStrategy}
              onChange={handleInputChange}
              placeholder="Rate 0 to 10"
              className="w-full h-[36px] px-[12px] border border-gray-200 rounded-[4px] outline-none focus:border-[#2F43F2] text-[#0E1629] text-[14px] placeholder:text-[#6B728080] placeholder:text-[12px]"
              style={{ fontFamily: 'Poppins' }}
            />
          </div>
        </div>

      </div>

      <div className="w-full max-w-[1200px] flex flex-col-reverse sm:flex-row justify-end gap-[12px] sm:gap-[16px] px-4 sm:px-0">
        <button 
          type="button"
          onClick={() => navigate(-1)}
          disabled={loading}
          className="w-full sm:w-[90px] h-[44px] rounded-[8px] border border-[#2F43F2] cursor-pointer bg-transparent py-[10px] px-[16px] flex items-center justify-center transition-colors hover:bg-gray-50"
        >
          <span 
            className="text-[#2F43F2] text-[16px] font-medium leading-[100%]"
            style={{ fontFamily: 'Poppins' }}
          >
            Cancel
          </span>
        </button>

        <button 
          type="submit"
          disabled={loading}
          className="w-full sm:w-[214px] h-[44px] rounded-[8px] border border-[#2F43F2] bg-[#2F43F2] cursor-pointer py-[10px] px-[16px] flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <span 
            className="text-white text-[16px] font-medium leading-[100%] text-nowrap"
            style={{ fontFamily: 'Poppins' }}
          >
            {loading ? "Submitting..." : "Complete Registration"}
          </span>
        </button>
      </div>

    </form>

      {profileCropImage ? (
        <ImageCropper
          image={profileCropImage}
          aspectRatio={1}
          title="Crop Profile Photo"
          onCropComplete={handleProfileCropComplete}
          onCancel={handleProfileCropCancel}
        />
      ) : null}

      {idCardCropImage ? (
        <ImageCropper
          image={idCardCropImage}
          aspectRatio={1.58}
          title="Crop ID Card"
          onCropComplete={handleIdCardCropComplete}
          onCancel={handleIdCardCropCancel}
        />
      ) : null}
    </>
  );
}
