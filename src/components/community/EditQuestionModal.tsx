import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/AuthStore';
import { updateQuestion } from '@/api/community';
import { toast } from 'react-hot-toast';

interface EditQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionId: string;
  currentQuestion: string;
  onUpdateSuccess: () => void;
}

const EditQuestionModal: React.FC<EditQuestionModalProps> = ({
  isOpen,
  onClose,
  questionId,
  currentQuestion,
  onUpdateSuccess,
}) => {
  const [questionText, setQuestionText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { userId } = useAuthStore();
  const token = localStorage.getItem('jwt');

  useEffect(() => {
    if (isOpen) {
      setQuestionText(currentQuestion || '');
    }
  }, [isOpen, currentQuestion]);

  const handleUpdate = async () => {
    if (!questionText.trim()) {
      toast.error('Question cannot be empty.');
      return;
    }

    if (!userId || !token) {
      toast.error('Please login to update question.');
      return;
    }

    try {
      setIsLoading(true);
      await updateQuestion(userId, questionId, questionText, token);
      toast.success('Question updated successfully!');
      onUpdateSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message || 'Failed to update question.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#23232380] backdrop-blur-[35px]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[632px] p-10 bg-white rounded-2xl shadow-xl border border-[#EFEFEF]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-6 right-6 w-9 h-9 flex items-center justify-center rounded-full text-black hover:bg-black hover:text-white transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        <h2 className="text-[20px] font-semibold text-[#343C6A] text-center mb-6">
          Edit Question
        </h2>

        <div className="flex flex-col gap-2 mb-6">
          <label className="text-base font-semibold text-[#343C6A]">
            Your Question <span className="text-red-500">*</span>
          </label>
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Type your question here..."
            rows={6}
            className="w-full resize-none bg-[#F5F7FA] border border-[#EFEFEF] rounded-lg p-3 text-base font-medium text-[#242645] focus:outline-none focus:ring-2 focus:ring-[#13097D]"
          />
        </div>

        <button
          onClick={handleUpdate}
          disabled={isLoading || !questionText.trim()}
          className={`w-full max-w-[335px] h-12 mx-auto rounded-xl text-white font-semibold flex items-center justify-center transition-all ${
            isLoading || !questionText.trim()
              ? 'bg-[#242645] opacity-50 cursor-not-allowed'
              : 'bg-[#655E95] hover:bg-opacity-90 cursor-pointer'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 size={20} className="animate-spin mr-2" />
              Updating...
            </>
          ) : (
            'Update Question'
          )}
        </button>
      </div>
    </div>
  );
};

export default EditQuestionModal;