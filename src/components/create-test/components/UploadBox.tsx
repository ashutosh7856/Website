import { useRef } from "react";

type UploadBoxProps = {
  file: File | null;
  setFile: (file: File | null) => void;
  existingImageUrl?: string | null;
  onImageSelect?: (imageUrl: string) => void;
  required?: boolean;
};

export default function UploadBox({ file, setFile, existingImageUrl, onImageSelect, required = false }: UploadBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => inputRef.current?.click();

  const validateAndSet = (f: File) => {
    const isValidType = ["image/png", "image/jpeg"].includes(f.type);
    const isValidSize = f.size <= 10 * 1024 * 1024;

    if (!isValidType) return alert("Only PNG and JPG allowed");
    if (!isValidSize) return alert("Max size 10MB");

    // If onImageSelect callback is provided, trigger cropper
    if (onImageSelect) {
      const reader = new FileReader();
      reader.onload = () => {
        onImageSelect(reader.result as string);
      };
      reader.readAsDataURL(f);
    } else {
      setFile(f);
    }
  };

  const hasImage = file || existingImageUrl;

  return (
    <div className="flex flex-col gap-2">
      {required && (
        <label className="text-[1rem] font-normal">
          Banner Image <span className="text-red-500">*</span>
        </label>
      )}
      <div
        onClick={!hasImage ? handleClick : undefined}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) validateAndSet(f);
        }}
        className="w-full h-[174px] border-2 border-dashed border-[#C1C1C1]
                   rounded-xl flex items-center justify-center p-4 bg-[#F4F7FB]"
      >
      <input
        ref={inputRef}
        type="file"
        accept="image/png, image/jpeg"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) validateAndSet(f);
          // Reset input value to allow selecting the same file again
          e.target.value = '';
        }}
      />

      {!hasImage ? (
        <div className="flex flex-col items-center justify-center text-center">
            <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            className="mb-2  text-(--text-app-primary)"
          >
            <path d="M12 16V4M12 4L7 9M12 4L17 9"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 16V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V16"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p className="font-semibold text-[1rem] text-(--text-app-primary)">Click to upload or drag and drop</p>
          <p className="text-[0.875rem] font-medium text-[#8C8CA1]">PNG, JPG up to 10MB</p>
        </div>
      ) : (
        <div className="flex gap-4 items-center w-full">
          <img loading="lazy" decoding="async"
            src={file ? URL.createObjectURL(file) : existingImageUrl!}
            className="h-20 w-20 object-cover rounded"
            alt="Banner"
          />
          <div className="flex-1">
            <p className="text-sm font-medium truncate">
              {file ? file.name : "Existing banner image"}
            </p>
            {file && (
              <p className="text-xs text-gray-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
            <div className="flex gap-3 mt-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }} 
                className="text-blue-600 text-xs cursor-pointer hover:text-blue-700 font-medium"
              >
                Replace Image
              </button>
            </div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}