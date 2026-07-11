import { EllipsisVertical, X, ChevronRight, FileText } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import toast from 'react-hot-toast';

type FileItem = {
  id: string;
  name: string;
  type: 'folder' | 'video' | 'image' | 'doc' | 'pdf' | 'link';
  size?: string;
  itemCount?: number;
  path: string;
  parentPath?: string;
};

type UploadItem = {
  id: string;
  name: string;
  type: 'video' | 'doc' | 'image' | 'link';
  size: string;
  progress: number;
};

type Step3CardProps = {
  courseId: string;
};

export default function Step3Card({ courseId }: Step3CardProps) {
  const [currentPath, setCurrentPath] = useState<string[]>(['root']);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [items, setItems] = useState<FileItem[]>([]);
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAddDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch existing course content
  useEffect(() => {
    const fetchExistingContent = async () => {
      try {
        const { getCounsellorCourseByCourseId } = await import('@/api/course');
        const { useAuthStore } = await import('@/store/AuthStore');
        const userId = useAuthStore.getState().userId;

        const courseDetails = await getCounsellorCourseByCourseId(userId as string, courseId);
        
        if (courseDetails.courseContents && courseDetails.courseContents.length > 0) {
          const existingItems: FileItem[] = courseDetails.courseContents.map((content) => ({
            id: content.courseContentId,
            name: content.name,
            type: content.type,
            size: content.fileSize ? `${(content.fileSize / 1024).toFixed(0)} kb` : undefined,
            itemCount: content.type === 'folder' ? 0 : undefined,
            path: content.path
          }));
          setItems(existingItems);
        }
      } catch (error) {
        console.error('Error fetching existing content:', error);
      }
    };

    if (courseId) {
      fetchExistingContent();
    }
  }, [courseId]);

  const getCurrentPathString = () => currentPath.join('/');

  const handleDeleteItem = async (item: FileItem) => {
    const toastId = toast.loading(`Deleting ${item.type}...`);
    
    try {
      const { useAuthStore } = await import('@/store/AuthStore');
      const userId = useAuthStore.getState().userId;
      
      if (item.type === 'folder') {
        const { deleteFolder } = await import('@/api/course');
        await deleteFolder({
          counsellorId: userId as string,
          courseId: courseId,
          name: item.name,
          parentPath: item.path.split('/').slice(0, -1).join('/') || 'root'
        });
      } else {
        const { deleteFile } = await import('@/api/course');
        await deleteFile({
          counsellorId: userId as string,
          courseId: courseId,
          name: item.name,
          parentPath: item.path.split('/').slice(0, -1).join('/') || 'root'
        });
      }
      
      setItems(items.filter(i => i.id !== item.id));
      toast.success(`${item.type === 'folder' ? 'Folder' : 'File'} deleted successfully!`, { id: toastId });
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete',
        { id: toastId }
      );
    }
  };

  const handleRenameItem = async (item: FileItem, newName: string) => {
    if (!newName.trim() || newName === item.name) return;
    
    const toastId = toast.loading(`Renaming ${item.type}...`);
    
    try {
      const { useAuthStore } = await import('@/store/AuthStore');
      const userId = useAuthStore.getState().userId;
      const parentPath = item.path.split('/').slice(0, -1).join('/') || 'root';
      
      if (item.type === 'folder') {
        const { renameFolder } = await import('@/api/course');
        await renameFolder({
          counsellorId: userId as string,
          courseId: courseId,
          name: item.name,
          parentPath: parentPath,
          newName: newName
        });
      } else {
        const { renameFile } = await import('@/api/course');
        await renameFile({
          counsellorId: userId as string,
          courseId: courseId,
          name: item.name,
          parentPath: parentPath,
          newName: newName
        });
      }
      
      // Update the item in state
      const newPath = parentPath + '/' + newName;
      setItems(items.map(i => 
        i.id === item.id 
          ? { ...i, name: newName, path: newPath }
          : i
      ));
      toast.success(`${item.type === 'folder' ? 'Folder' : 'File'} renamed successfully!`, { id: toastId });
    } catch (error) {
      console.error('Error renaming:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to rename',
        { id: toastId }
      );
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    const toastId = toast.loading('Creating folder...');
    
    try {
      const { addFolder } = await import('@/api/course');
      const { useAuthStore } = await import('@/store/AuthStore');
      const userId = useAuthStore.getState().userId;

      await addFolder({
        counsellorId: userId as string,
        courseId: courseId,
        name: newFolderName,
        parentPath: getCurrentPathString()
      });

      const newFolder: FileItem = {
        id: Date.now().toString(),
        name: newFolderName,
        type: 'folder',
        itemCount: 0,
        path: getCurrentPathString() + '/' + newFolderName
      };
      setItems([...items, newFolder]);
      setNewFolderName('');
      setShowFolderInput(false);
      setShowAddDropdown(false);
      toast.success('Folder created successfully!', { id: toastId });
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create folder',
        { id: toastId }
      );
    }
  };

  const handleFileUpload = () => {
    setShowAddDropdown(false);
    fileInputRef.current?.click();
  };

  const simulateUpload = async (file: File, type: 'video' | 'doc' | 'image') => {
    const uploadId = Date.now().toString();
    const uploadItem: UploadItem = {
      id: uploadId,
      name: file.name,
      type,
      size: `${(file.size / 1024).toFixed(0)} kb`,
      progress: 0
    };
    
    setUploadQueue(prev => [...prev, uploadItem]);

    try {
      const { addFile } = await import('@/api/course');
      const { useAuthStore } = await import('@/store/AuthStore');
      const userId = useAuthStore.getState().userId;

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadQueue(prev => {
          const updated = prev.map(item => {
            if (item.id === uploadId && item.progress < 90) {
              return { ...item, progress: item.progress + 10 };
            }
            return item;
          });
          return updated;
        });
      }, 300);

      // Upload file
      await addFile(
        userId as string,
        courseId,
        getCurrentPathString(),
        file
      );

      clearInterval(progressInterval);

      // Complete progress
      setUploadQueue(prev =>
        prev.map(item =>
          item.id === uploadId ? { ...item, progress: 100 } : item
        )
      );

      setTimeout(() => {
        setUploadQueue(prev => prev.filter(item => item.id !== uploadId));
        const newItem: FileItem = {
          id: uploadId,
          name: file.name,
          type,
          size: `${(file.size / 1024).toFixed(0)} kb`,
          path: getCurrentPathString() + '/' + file.name
        };
        setItems(prev => [...prev, newItem]);
        toast.success('File uploaded successfully!');
      }, 500);
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadQueue(prev => prev.filter(item => item.id !== uploadId));
      toast.error(
        error instanceof Error ? error.message : 'Failed to upload file'
      );
    }
  };

  const handleNavigateTo = (index: number) => {
    setCurrentPath(currentPath.slice(0, index + 1));
  };

  const handleOpenFolder = (folder: FileItem) => {
    if (folder.type === 'folder') {
      setCurrentPath([...currentPath, folder.name]);
    }
  };

  const getFilteredItems = () => {
    const pathString = getCurrentPathString();
    return items.filter(item => {
      const itemPathParts = item.path.split('/');
      itemPathParts.pop();
      return itemPathParts.join('/') === pathString;
    });
  };

  return (
    <>
    <div className="flex flex-col gap-3 md:gap-5 bg-white w-full min-h-80 md:min-h-[29.688rem] p-3 md:p-6 pb-4 md:pb-8 rounded-2xl overflow-visible">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleNavigateTo(0)}
            className="text-sm md:text-[1.25rem] font-medium text-[#9499B2] hover:text-[#13097D] transition-colors cursor-pointer"
          >
            Content
          </button>
          {currentPath.length > 1 && (
            <>
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-[#13097D]" />
              {currentPath.slice(1).map((path, index) => (
                <div key={index} className="flex items-center gap-1">
                  <button
                    onClick={() => handleNavigateTo(index + 1)}
                    className="text-sm md:text-[1.25rem] font-medium text-[#13097D] hover:underline transition-colors cursor-pointer"
                  >
                    {path}
                  </button>
                  {index < currentPath.length - 2 && (
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-[#13097D]" />
                  )}
                </div>
              ))}
            </>
          )}
        </div>
        <div className="relative z-20" ref={dropdownRef}>
          <button 
            onClick={() => setShowAddDropdown(!showAddDropdown)}
            className="flex items-center gap-1 md:gap-2 py-1.5 md:py-2 px-3 md:px-6 border border-[#13097D] text-[#13097D] rounded-[0.75rem] font-semibold text-xs md:text-[1rem] hover:bg-[#13097D] hover:text-white transition-all duration-200 cursor-pointer"
          >
            Add
          </button>
          
          {showAddDropdown && (
            <div className="absolute right-0 top-12 w-48 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-30">
              <button
                onClick={() => {
                  setShowFolderInput(true);
                  setShowAddDropdown(false);
                }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#f5f5f7] transition-colors text-left cursor-pointer"
              >
                <img loading="lazy" decoding="async" src="/folder.svg" alt="folder-icon" className="w-4 h-4 md:w-5 md:h-5"/>
                <span className="text-xs md:text-base font-medium text-[#242645]">Folder</span>
              </button>
              <button
                onClick={handleFileUpload}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#f5f5f7] transition-colors text-left cursor-pointer"
              >
                <img loading="lazy" decoding="async" src="/video.svg" alt="video-icon" className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-xs md:text-base font-medium text-[#242645]">Video</span>
              </button>
              <button
                onClick={handleFileUpload}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#f5f5f7] transition-colors text-left cursor-pointer"
              >
                <img loading="lazy" decoding="async" src="/pdf.svg" alt="pdf-icon" className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-xs md:text-base font-medium text-[#242645]">Document</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Folder Creation Input */}
      {showFolderInput && (
        <div className="flex gap-2 items-center p-3 bg-[#f5f5f7] rounded-lg">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            className="flex-1 bg-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#13097D]"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
          <button
            onClick={handleCreateFolder}
            className="px-4 py-2 bg-[#13097D] text-white rounded-lg font-medium hover:bg-[#0f0760] transition-colors cursor-pointer"
          >
            Create
          </button>
          <button
            onClick={() => {
              setShowFolderInput(false);
              setNewFolderName('');
            }}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* File/Folder Items */}
      <div className="flex flex-col gap-3">
        {getFilteredItems().map(item => (
          <FileItemComponent
            key={item.id}
            item={item}
            onOpen={handleOpenFolder}
            onDelete={handleDeleteItem}
            onRename={handleRenameItem}
          />
        ))}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const fileType = file.type;
            let type: 'video' | 'doc' | 'image' = 'doc';
            if (fileType.startsWith('video/')) type = 'video';
            else if (fileType.startsWith('image/')) type = 'image';
            simulateUpload(file, type);
          }
        }}
      />
    </div>

    {/* Upload Progress */}
    {uploadQueue.length > 0 && (
      <div className="flex flex-col gap-3 mt-4">
        {uploadQueue.map(upload => (
          <UploadProgressComponent
            key={upload.id}
            upload={upload}
            onCancel={(id) => setUploadQueue(prev => prev.filter(item => item.id !== id))}
          />
        ))}
      </div>
    )}
    </>
  );
}


function FileItemComponent({ item, onOpen, onDelete, onRename }: { 
  item: FileItem; 
  onOpen: (item: FileItem) => void;
  onDelete: (item: FileItem) => void;
  onRename: (item: FileItem, newName: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newName, setNewName] = useState(item.name);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = () => {
    switch (item.type) {
      case 'folder':
        return <img loading="lazy" decoding="async" src="/folder.svg" alt="folder" className="w-6 h-6" />;
      case 'video':
        return <img loading="lazy" decoding="async" src="/video.svg" alt="video" className="w-6 h-6" />;
      case 'doc':
        return <img loading="lazy" decoding="async" src="/pdf.svg" alt="document" className="w-6 h-6" />;
      case 'image':
        return <img loading="lazy" decoding="async" src="/pdf.svg" alt="image" className="w-6 h-6" />;
      default:
        return <FileText className="w-6 h-6 text-[#13097D]" />;
    }
  };

  const getSubtext = () => {
    if (item.type === 'folder') {
      return `${item.itemCount || 0} items`;
    }
    return item.size || '';
  };

  return (
    <>
      <div
        className={`flex py-2 md:py-3 px-2 md:px-4 bg-[#f5f5f7] justify-between min-h-12 md:h-14 rounded-2xl items-center ${
          item.type === 'folder' ? 'cursor-pointer hover:bg-[#ebebed]' : ''
        } transition-colors`}
        onClick={() => item.type === 'folder' && onOpen(item)}
        role={item.type === 'folder' ? 'button' : undefined}
        tabIndex={item.type === 'folder' ? 0 : undefined}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && item.type === 'folder') { onOpen(item); } }}
      >
        <div className="flex gap-1.5 md:gap-2 items-center min-w-0 flex-1">
          <div className="shrink-0">{getIcon()}</div>
          <p className="flex flex-col text-xs md:text-[1rem] font-semibold text-[#242645] min-w-0">
            <span className="truncate">{item.name}</span>
            <span className="text-[0.625rem] md:text-[0.875rem] text-[#8C8CA1] font-normal truncate">
              {getSubtext()}
            </span>
          </p>
        </div>
        
        <div className="relative shrink-0" ref={menuRef}>
          <EllipsisVertical 
            className="w-4 h-4 md:w-5 md:h-5 text-[#8C8CA1] cursor-pointer hover:text-[#13097D]" 
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
          />
          
          {showMenu && (
            <div className="absolute right-0 top-6 bg-white rounded-lg shadow-xl border border-gray-200 z-50 min-w-[120px] md:min-w-[140px] py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  setShowRenameDialog(true);
                }}
                className="w-full px-3 md:px-4 py-2 text-left text-xs md:text-sm hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
              >
                <span>✏️</span> Rename
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  setShowDeleteDialog(true);
                }}
                className="w-full px-3 md:px-4 py-2 text-left text-xs md:text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer"
              >
                <span>🗑️</span> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Rename Dialog */}
      {showRenameDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-70 flex items-center justify-center p-4" onClick={() => setShowRenameDialog(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#343C6A] mb-4">
              Rename {item.type === 'folder' ? 'Folder' : 'File'}
            </h3>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[#13097D]"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newName.trim()) {
                  onRename(item, newName);
                  setShowRenameDialog(false);
                }
              }}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowRenameDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newName.trim()) {
                    onRename(item, newName);
                    setShowRenameDialog(false);
                  }
                }}
                className="px-4 py-2 bg-[#13097D] text-white rounded-lg hover:bg-opacity-90 cursor-pointer"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-70 flex items-center justify-center p-4" onClick={() => setShowDeleteDialog(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Delete {item.type === 'folder' ? 'Folder' : 'File'}?
              </h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                {item.type === 'folder' 
                  ? 'This folder and all its contents will be permanently deleted.'
                  : `"${item.name}" will be permanently deleted.`}
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowDeleteDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDelete(item);
                    setShowDeleteDialog(false);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function UploadProgressComponent({ upload, onCancel }: { upload: UploadItem; onCancel: (id: string) => void }) {
  const getIcon = () => {
    switch (upload.type) {
      case 'video':
        return <img loading="lazy" decoding="async" src="/video.svg" alt="video" className="w-6 h-6" />;
      case 'doc':
        return <img loading="lazy" decoding="async" src="/pdf.svg" alt="document" className="w-6 h-6" />;
      case 'image':
        return <img loading="lazy" decoding="async" src="/pdf.svg" alt="image" className="w-6 h-6" />;
      default:
        return <FileText className="w-6 h-6 text-[#13097D]" />;
    }
  };

  return (
    <div className="w-222 bg-white rounded-2xl shadow-sm border border-[#f5f5f7] p-3">
      <div className="flex justify-between">
        <div className="flex gap-2 items-center">
          {getIcon()}
          <p className="flex flex-col text-[1rem] font-semibold text-[#242645]">
            {upload.name}
            <span className="text-[0.875rem] text-[#8C8CA1] font-normal">
              {upload.size} | {upload.progress}%
            </span>
          </p>
        </div>
        <button
          onClick={() => onCancel(upload.id)}
          className="group hover:bg-gray-900 h-5 w-5 flex items-center justify-center hover:text-white rounded-full transition-colors duration-200 cursor-pointer"
          aria-label="Cancel upload"
        >
          <X className="w-4 h-4 text-gray-600 group-hover:text-white" />
        </button>
      </div>

      <div className="h-1.5 bg-[#D9D9D9] rounded-2xl mt-3 overflow-hidden">
        <div 
          className="h-full bg-[#3AAF3C] transition-all duration-300 rounded-2xl"
          style={{ width: `${upload.progress}%` }}
        />
      </div>
    </div>
  );
}
