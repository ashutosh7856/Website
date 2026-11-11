import { API_CONFIG } from './config';
import type { 
  GetQuestionsListResponse, 
  GetCommunityDashboardResponse, 
  GetAllAnswersResponse, 
  AskQuestionResponse, 
  PostAnswerResponse,
  GetCommentsResponse,
  GetRepliesResponse,
  GetMyAnswersResponse,
} from '@/types/community';

const { baseUrl } = API_CONFIG;

export async function getQuestionsList(
  loggedInUserId?: string,
  token?: string,
  pageToken?: string | null
): Promise<GetQuestionsListResponse> {
  try {
    let url = `${baseUrl}${API_CONFIG.endpoints.getQuestionsList}`;
    const params = new URLSearchParams();
    if (loggedInUserId) params.set('loggedInUserId', loggedInUserId);
    
    if (pageToken) params.set('nextPageToken', pageToken);
    const query = params.toString();
    if (query) url += `?${query}`;

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(url, {
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP ${response.status}: Failed to fetch questions. Details: ${errorBody}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get Questions List Error:', error);
    throw error;
  }
}

export async function getCommunityDashboard(
  userId?: string,
  token?: string,
  pageToken?: string | null
): Promise<GetCommunityDashboardResponse> {
  try {
    let url = `${baseUrl}${API_CONFIG.endpoints.getCommunityDashboard}`;
    const params = new URLSearchParams();
    if (userId) params.set('userId', userId);
    if (pageToken) params.set('nextPageToken', pageToken);
    const query = params.toString();
    if (query) url += `?${query}`;

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(url, {
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP ${response.status}: Failed to fetch community dashboard. Details: ${errorBody}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get Community Dashboard Error:', error);
    throw error;
  }
}

/** Thrown when the backend says the question itself does not exist. */
export class QuestionNotFoundError extends Error {
  constructor(message = 'Question not found') {
    super(message);
    this.name = 'QuestionNotFoundError';
  }
}

/**
 * Question detail — the one community view a logged-out visitor can reach.
 *
 * Every /api/community/** route is behind the JWT filter and answers 401 to an
 * anonymous request, which is why opening a question while logged out (or with
 * a token the backend will not accept) failed. `/api/shared/` carries an
 * unauthenticated twin of exactly this one endpoint, so the caller is routed by
 * whether it actually has a token.
 *
 * Both twins answer HTTP 500 for "Question not found" with the verdict in the
 * body, so success is decided by `status`, never by `response.ok`.
 */
export async function getAllAnswersForSpecificQuestion(
  questionId: string,
  loggedInUserId?: string,
  token?: string,
  role: string = 'user'
): Promise<GetAllAnswersResponse> {
  const hasToken = Boolean(token && token.trim());
  const endpoint = hasToken
    ? API_CONFIG.endpoints.getAllAnswersForQuestion
    : API_CONFIG.endpoints.getAllAnswersForQuestionPublic;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (hasToken) headers['Authorization'] = `Bearer ${token}`;

    const body: Record<string, string> = {
      questionId,
      role,
    };
    // A guest has no id to personalise "did I bookmark this" with, and sending
    // one without a token is what the shared endpoint rejects.
    if (hasToken && loggedInUserId) body.loggedInUserId = loggedInUserId;

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const raw = await response.text();
    let data: GetAllAnswersResponse | null = null;
    try {
      data = JSON.parse(raw) as GetAllAnswersResponse;
    } catch {
      data = null;
    }

    if (data && String(data.status).toLowerCase() === 'success') {
      return data;
    }

    const message = (data as { message?: string } | null)?.message?.trim();
    if (message && /not found/i.test(message)) {
      throw new QuestionNotFoundError(message);
    }

    throw new Error(
      message || `HTTP ${response.status}: Failed to fetch answers.`
    );
  } catch (error) {
    console.error('Get All Answers Error:', error);
    throw error;
  }
}

export async function askQuestion(
  userId: string,
  subject: string,
  question: string,
  role: string,
  token: string,
  anonymous: boolean
): Promise<AskQuestionResponse> {
  try {
    const response = await fetch(
      `${baseUrl}${API_CONFIG.endpoints.askQuestion}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          subject,
          question,
          role,
          anonymous,
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP ${response.status}: Failed to post question. Details: ${errorBody}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Ask Question Error:', error);
    throw error;
  }
}

export async function postAnswer(
  questionId: string,
  answer: string,
  userIdAnswered: string,
  role: string,
  token: string,
  imageFile?: File | null
): Promise<PostAnswerResponse> {
  const formData = new FormData();
  formData.append('questionId', questionId);
  formData.append('answer', answer);
  formData.append('userIdAnswered', userIdAnswered);
  formData.append('role', role);
  if (imageFile) {
    formData.append('image', imageFile);
  }

  try {
    const response = await fetch(
      `${baseUrl}${API_CONFIG.endpoints.postAnswer}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP ${response.status}: Failed to post answer. Details: ${errorBody}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Post Answer Error:', error);
    throw error;
  }
}

export async function getCommentsForAnswer(
  answerId: string,
  loggedInUserId?: string,
  token?: string
): Promise<GetCommentsResponse> {
  try {
    const params = new URLSearchParams({ answerId });
    if (loggedInUserId) params.set('loggedInUserId', loggedInUserId);

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(
      `${baseUrl}${API_CONFIG.endpoints.getComments}?${params.toString()}`,
      {
        headers,
      }
    );
    if (!response.ok) throw new Error('Failed to fetch comments');
    return await response.json();
  } catch (error) {
    console.error('Get Comments Error:', error);
    throw error;
  }
}

export async function getRepliesForComment(
  commentId: string,
  loggedInUserId?: string,
  token?: string
): Promise<GetRepliesResponse> {
  try {
    const params = new URLSearchParams({ commentId });
    if (loggedInUserId) params.set('loggedInUserId', loggedInUserId);

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(
      `${baseUrl}${API_CONFIG.endpoints.getReplies}?${params.toString()}`,
      {
        headers,
      }
    );
    if (!response.ok) throw new Error('Failed to fetch replies');
    return await response.json();
  } catch (error) {
    console.error('Get Replies Error:', error);
    throw error;
  }
}

export async function addComment(
  userIdCommented: string,
  answerId: string,
  commentText: string,
  role: string,
  token: string
): Promise<unknown> {
  try {
    const url = `${baseUrl}${API_CONFIG.endpoints.addComment}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        userIdCommented,
        answerId,
        commentText,
        role,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP ${response.status}: Failed to post comment. Details: ${errorBody}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Add Comment Error:', error);
    throw error;
  }
}

export async function addReply(
  userIdReplied: string,
  repliedToUserId: string,
  commentId: string,
  replyText: string,
  role: string,
  token: string
): Promise<unknown> {
  try {
    const url = `${baseUrl}${API_CONFIG.endpoints.addReply}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        userIdReplied,
        repliedToUserId,
        commentId,
        replyText,
        role,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP ${response.status}: Failed to post reply. Details: ${errorBody}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Add Reply Error:', error);
    throw error;
  }
}

export async function bookmarkQuestion(
  userId: string,
  questionId: string,
  role: string,
  token: string
): Promise<{ isBookmarked: boolean; message: string; status: string }> {
  try {
    const url = `${baseUrl}${API_CONFIG.endpoints.bookmarkQuestion}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId,
        questionId,
        role,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP ${response.status}: Failed to bookmark question. Details: ${errorBody}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Bookmark Question Error:', error);
    throw error;
  }
}

export async function likeAnswer(
  userId: string,
  answerId: string,
  role: string,
  token: string
): Promise<{ isLiked: boolean; message: string; status: string }> {
  try {
    const url = `${baseUrl}${API_CONFIG.endpoints.likeAnswer}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId,
        answerId,
        role,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP ${response.status}: Failed to like/unlike answer. Details: ${errorBody}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Like Answer Error:', error);
    throw error;
  }
}

export async function likeComment(
  userId: string,
  commentId: string,
  role: string,
  token: string
): Promise<{ isLiked: boolean; message: string; status: string }> {
  try {
    const url = `${baseUrl}${API_CONFIG.endpoints.likeComment}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, commentId, role }),
    });

    if (!response.ok) throw new Error('Failed to like comment');
    return await response.json();
  } catch (error) {
    console.error('Like Comment Error:', error);
    throw error;
  }
}

export async function likeReply(
  userId: string,
  replyId: string,
  role: string,
  token: string
): Promise<{ isLiked: boolean; message: string; status: string }> {
  try {
    const url = `${baseUrl}${API_CONFIG.endpoints.likeReply}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, replyId, role }),
    });

    if (!response.ok) throw new Error('Failed to like reply');
    return await response.json();
  } catch (error) {
    console.error('Like Reply Error:', error);
    throw error;
  }
}

export async function getMyQuestions(
  userId: string,
  token: string,
  pageToken?: string | null
): Promise<GetCommunityDashboardResponse> {
  try {
    let url = `${baseUrl}${API_CONFIG.endpoints.getMyQuestions}?userId=${userId}`;
    
    if (pageToken) {
      url += `&nextPageToken=${pageToken}`;
    }

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP ${response.status}: Failed to fetch my questions. Details: ${errorBody}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get My Questions Error:', error);
    throw error;
  }
}


export async function getMyAnswers(
  userId: string,
  token: string
): Promise<GetMyAnswersResponse> {
  try {
    const response = await fetch(
      `${baseUrl}${API_CONFIG.endpoints.getMyAnswers}?userId=${userId}`,
      {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP ${response.status}: Failed to fetch my answers. Details: ${errorBody}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get My Answers Error:', error);
    throw error;
  }
}

export async function getMyBookmarkedQuestions(
  userId: string,
  token: string
): Promise<GetQuestionsListResponse> {
  try {
    const response = await fetch(
      `${baseUrl}${API_CONFIG.endpoints.getMyBookmarkedQuestions}?userId=${userId}`,
      {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP ${response.status}: Failed to fetch bookmarked questions. Details: ${errorBody}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get My Bookmarked Questions Error:', error);
    throw error;
  }
}

export async function bookmarkAnswer(
  userId: string,
  answerId: string,
  role: string,
  token: string
): Promise<{ isBookmarked: boolean; message: string; status: string }> {
  try {
    const url = `${baseUrl}${API_CONFIG.endpoints.bookmarkAnswer}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId,
        answerId,
        role,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP ${response.status}: Failed to bookmark answer. Details: ${errorBody}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Bookmark Answer Error:', error);
    throw error;
  }
}

export async function deleteAnswer(
  answerId: string,
  questionId: string,
  userIdAnswered: string,
  role: string,
  token: string
): Promise<{ message: string; status: string }> {
  try {
    const url = `${baseUrl}${API_CONFIG.endpoints.deleteAnswer}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        answerId,
        questionId,
        userIdAnswered,
        role,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP ${response.status}: Failed to delete answer. Details: ${errorBody}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Delete Answer Error:', error);
    throw error;
  }
}

export async function updateAnswer(
  answerId: string,
  answer: string,
  userId: string,
  role: string,
  token: string,
  imageFile?: File | null
): Promise<PostAnswerResponse> {
  const formData = new FormData();
  formData.append('answerId', answerId);
  formData.append('updatedAnswerText', answer);
  formData.append('userIdAnswered', userId);
  formData.append('role', role);
  if (imageFile) {
    formData.append('newPhotos', imageFile);
  }

  try {
    const response = await fetch(
      `${baseUrl}${API_CONFIG.endpoints.updateAnswer}`,
      {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP ${response.status}: Failed to update answer. Details: ${errorBody}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Update Answer Error:', error);
    throw error;
  }
}

export async function getAnswersByQuestionId(
  questionId: string,
  loggedInUserId?: string,
  token?: string
): Promise<GetAllAnswersResponse> {
  try {
    const params = new URLSearchParams({ questionId });
    if (loggedInUserId) params.set('loggedInUserId', loggedInUserId);

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(
      `${baseUrl}${API_CONFIG.endpoints.getAnswersByQuestionId}?${params.toString()}`,
      {
        headers,
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP ${response.status}: Failed to fetch answers. Details: ${errorBody}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get Answers By Question Id Error:', error);
    throw error;
  }
}

export async function deleteQuestion(
  userId: string,
  questionId: string,
  token: string
): Promise<{ message: string; status: string }> {
  try {
    const url = `${baseUrl}${API_CONFIG.endpoints.deleteQuestion}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId,
        questionId,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP ${response.status}: Failed to delete question. Details: ${errorBody}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Delete Question Error:', error);
    throw error;
  }
}

export async function updateQuestion(
  userId: string,
  questionId: string,
  questionText: string,
  token: string
): Promise<{ message: string; status: string }> {
  try {
    const url = `${baseUrl}${API_CONFIG.endpoints.updateQuestion}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        questionId,
        userId,
        question: questionText,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP ${response.status}: Failed to update question. Details: ${errorBody}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Update Question Error:', error);
    throw error;
  }
}

export async function searchCommunityQuestions(
  searchTerm: string,
  options?: {
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    pageSize?: number;
  }
): Promise<GetCommunityDashboardResponse> {
  try {
    const params = new URLSearchParams({ search: searchTerm });
    if (options?.sortBy) params.set('sortBy', options.sortBy);
    if (options?.sortOrder) params.set('sortOrder', options.sortOrder);
    if (options?.page !== undefined) params.set('page', String(options.page));
    if (options?.pageSize !== undefined) params.set('pageSize', String(options.pageSize));
    const url = `${baseUrl}/api/shared/community/dashboard/getCommunityDashboard/search?${params.toString()}`;

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP ${response.status}: Failed to search questions. Details: ${errorBody}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Search Community Questions Error:', error);
    throw error;
  }
}

export async function searchQuestionsList(
  loggedInUserId: string | undefined,
  searchTerm: string,
  token?: string
): Promise<GetQuestionsListResponse> {
  try {
    const params = new URLSearchParams({ search: searchTerm });
    if (loggedInUserId) params.set('loggedInUserId', loggedInUserId);
    const url = `${baseUrl}${API_CONFIG.endpoints.getQuestionsList}/search?${params.toString()}`;

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP ${response.status}: Failed to search questions list. Details: ${errorBody}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Search Questions List Error:', error);
    throw error;
  }
}

export async function searchMyQuestions(
  userId: string,
  searchTerm: string,
  token: string
): Promise<GetCommunityDashboardResponse> {
  try {
    const url = `${baseUrl}${API_CONFIG.endpoints.getMyQuestions}/search?userId=${userId}&search=${encodeURIComponent(searchTerm)}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP ${response.status}: Failed to search my questions. Details: ${errorBody}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Search My Questions Error:', error);
    throw error;
  }
}

export async function searchMyAnswers(
  userId: string,
  searchTerm: string,
  token: string
): Promise<GetMyAnswersResponse> {
  try {
    const url = `${baseUrl}${API_CONFIG.endpoints.getMyAnswers}/search?userId=${userId}&search=${encodeURIComponent(searchTerm)}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP ${response.status}: Failed to search my answers. Details: ${errorBody}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Search My Answers Error:', error);
    throw error;
  }
}

export async function searchMyBookmarkedQuestions(
  userId: string,
  searchTerm: string,
  token: string
): Promise<GetQuestionsListResponse> {
  try {
    const url = `${baseUrl}${API_CONFIG.endpoints.getMyBookmarkedQuestions}/search?userId=${userId}&search=${encodeURIComponent(searchTerm)}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`HTTP ${response.status}: Failed to search bookmarks. Details: ${errorBody}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Search Bookmarks Error:', error);
    throw error;
  }
}
