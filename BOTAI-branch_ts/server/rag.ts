/**
 * RAG (Retrieval Augmented Generation) service for clinical trial data
 * Combines vector database retrieval with AI models for enhanced data context
 */

import OpenAI from "openai";
import { vectorDb, type VectorDocument, type VectorSearchResult } from "./vectorDb";

// Check if OpenAI API key is available
const hasOpenAI = !!process.env.OPENAI_API_KEY;

// Initialize OpenAI if available
const openai = hasOpenAI 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Define RAG query options interface
export interface RAGQueryOptions {
  collectionName: string;
  query: string;
  topK?: number;
  filter?: Record<string, any>;
  includeContent?: boolean;
  maxTokens?: number;
}

// Define RAG response interface
export interface RAGResponse {
  answer: string;
  sourceDocuments?: VectorSearchResult[];
  error?: string;
}

/**
 * RAG processing class for integrating vector search with LLM generation
 */
class RAGProcessor {
  /**
   * Process a query using RAG methodology
   * 1. Retrieve relevant documents from vector database
   * 2. Generate a response using the retrieved context
   */
  public async query(options: RAGQueryOptions): Promise<RAGResponse> {
    try {
      // Extract options with defaults
      const {
        collectionName,
        query,
        topK = 5,
        filter = {},
        includeContent = true,
        maxTokens = 500
      } = options;

      // Step 1: Retrieve relevant documents
      const searchResults = await vectorDb.query(collectionName, query, {
        topK,
        filter
      });

      if (searchResults.length === 0) {
        return {
          answer: "I couldn't find any relevant information in the database to answer your query.",
          sourceDocuments: []
        };
      }

      // Step 2: Generate an enhanced prompt with the retrieved context
      const context = searchResults
        .map(doc => `Document: ${doc.content}\nRelevance: ${doc.score.toFixed(2)}\n`)
        .join("\n");

      // Step 3: Generate a response based on the context and query
      let answer = "";
      
      if (hasOpenAI && openai) {
        // Use OpenAI to generate a response with context
        const prompt = `You are an AI assistant for clinical trial management. 
          Answer the following question based ONLY on the provided context documents.
          If the context doesn't contain relevant information to answer the question, 
          state that you don't have enough information.
          
          Context:
          ${context}
          
          Question: ${query}
          
          Answer:`;

        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [{ role: "user", content: prompt }],
          max_tokens: maxTokens
        });

        answer = response.choices[0].message.content || "No response generated.";
      } else {
        // Fallback to basic information extraction without OpenAI
        answer = `Based on the retrieved documents, here's what I found:\n\n${
          searchResults.slice(0, 3).map(doc => 
            `- ${doc.content.substring(0, 200)}${doc.content.length > 200 ? '...' : ''}`
          ).join('\n\n')
        }\n\nNote: For more advanced analysis, please configure an OpenAI API key.`;
      }

      // Return the results
      return {
        answer,
        sourceDocuments: includeContent ? searchResults : undefined
      };
    } catch (error) {
      console.error("RAG query error:", error);
      return {
        answer: "An error occurred while processing your query.",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Get a list of all available collections in the vector database
   */
  public listCollections(): string[] {
    return vectorDb.listCollections();
  }

  /**
   * Utility to handle document ingestion into the vector database
   * This allows adding domain knowledge that can be retrieved during queries
   */
  public async ingestDocuments(
    collectionName: string,
    documents: Array<{
      id: string;
      content: string;
      metadata: Record<string, any>;
    }>
  ): Promise<string[]> {
    // Create collection if it doesn't exist
    if (!vectorDb.listCollections().includes(collectionName)) {
      vectorDb.createCollection(collectionName);
    }
    
    // Insert documents
    return await vectorDb.upsert(collectionName, documents);
  }
}

// Export a singleton instance
export const rag = new RAGProcessor();