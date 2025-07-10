import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Make an API request with proper error handling
 * @param url The URL to fetch
 * @param method HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param body Optional request body (will be JSON stringified)
 * @returns The parsed response JSON
 */
export async function apiRequest<T = any>(
  url: string,
  method: string = 'GET',
  body?: any
): Promise<T> {
  console.log(`Making API request: ${method} ${url}`, body ? { body } : '');
  
  try {
    // Configure the fetch request
    const options: RequestInit = {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // Always include credentials for auth
    };
    
    // Only add body for non-GET requests with actual data
    if (method !== 'GET' && body !== undefined) {
      options.body = JSON.stringify(body);
    }
    
    // Make the request
    const response = await fetch(url, options);
    
    console.log(`API Response: ${response.status} ${response.statusText} for ${method} ${url}`);
    
    // Handle authentication errors
    if (response.status === 401) {
      console.error(`Authentication error (${method} ${url}): Not authenticated`);
      throw new Error("Not authenticated");
    }
    
    // Check for other errors
    if (!response.ok) {
      const errorText = await response.text();
      const errorMessage = `${response.status}: ${errorText || response.statusText}`;
      console.error(`API Error: ${errorMessage}`);
      throw new Error(errorMessage);
    }
    
    // For non-GET methods with 204 status (no content), return empty object
    if (method !== 'GET' && response.status === 204) {
      return {} as T;
    }
    
    // Parse JSON response
    try {
      return await response.json() as T;
    } catch (jsonError) {
      console.warn(`Failed to parse JSON response: ${jsonError}`);
      const text = await response.text();
      return { text } as unknown as T;
    }
  } catch (error) {
    console.error(`API Request Failed: ${method} ${url}`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    console.log(`Default queryFn Request: GET ${url}`);
    
    const res = await fetch(url, {
      credentials: "include",
    });
    
    console.log(`Default queryFn Response status: ${res.status} for GET ${url}`);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log(`Auth check failed (returnNull) for ${url}`);
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 10000, // 10 seconds staleTime instead of Infinity
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
