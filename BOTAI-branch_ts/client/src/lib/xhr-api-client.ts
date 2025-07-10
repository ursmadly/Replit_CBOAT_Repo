/**
 * XHR-based API client as an alternative to fetch
 * This uses XMLHttpRequest instead of fetch to handle HTTP requests,
 * which might avoid the "invalid method fetch" error in some environments.
 */

export interface XhrRequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: any;
  headers?: Record<string, string>;
  responseType?: XMLHttpRequestResponseType;
}

export function xhrRequest<T = any>(options: XhrRequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    const {
      url,
      method = 'GET',
      data = null,
      headers = {},
      responseType = 'json'
    } = options;

    try {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.responseType = responseType;
      
      // Set default headers
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      // Set custom headers
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
      
      xhr.withCredentials = true; // For credentials like cookies
      
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          // For 204 No Content responses
          if (xhr.status === 204) {
            resolve({} as T);
            return;
          }
          
          // Handle response based on type
          if (responseType === 'json') {
            try {
              // If the response is valid JSON, parse it
              const response = xhr.response ? xhr.response : {};
              resolve(response as T);
            } catch (e) {
              reject(new Error(`Failed to parse JSON response: ${e}`));
            }
          } else {
            resolve(xhr.response as T);
          }
        } else {
          reject(new Error(`Request failed with status ${xhr.status}: ${xhr.statusText}`));
        }
      };
      
      xhr.onerror = function() {
        reject(new Error('Network error occurred'));
      };
      
      xhr.ontimeout = function() {
        reject(new Error('Request timed out'));
      };
      
      // Send the request with data if it exists
      if (data) {
        xhr.send(JSON.stringify(data));
      } else {
        xhr.send();
      }
    } catch (error) {
      console.error("XHR Request Error:", error);
      reject(error);
    }
  });
}