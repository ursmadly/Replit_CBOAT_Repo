/**
 * In-memory vector database for clinical trial data
 * Provides vector storage and similarity search functionality without external dependencies
 */

import { createHash } from 'crypto';

export interface VectorDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  vector?: number[];
}

export interface VectorQuery {
  vector: number[];
  topK?: number;
  filter?: Record<string, any>;
}

export interface VectorSearchResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  score: number;
}

const VECTOR_DIMENSION = 384; // Dimension of our vectors

class InMemoryVectorDb {
  private documents: Map<string, VectorDocument> = new Map();
  private collections: Map<string, Set<string>> = new Map();

  // Simple dot product for vector similarity
  private dotProduct(a: number[], b: number[]): number {
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
  }

  // Magnitude of a vector
  private magnitude(vec: number[]): number {
    return Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  }

  // Cosine similarity between two vectors
  private cosineSimilarity(a: number[], b: number[]): number {
    const magA = this.magnitude(a);
    const magB = this.magnitude(b);
    
    if (magA === 0 || magB === 0) return 0;
    
    return this.dotProduct(a, b) / (magA * magB);
  }

  // Generate a deterministic vector from text content
  private textToVector(text: string): number[] {
    // Create a deterministic hash of the text
    const hash = createHash('sha256').update(text).digest('hex');
    
    // Use the hash to seed a simple vector
    const vector: number[] = [];
    for (let i = 0; i < VECTOR_DIMENSION; i++) {
      // Use different parts of the hash for each dimension
      const hashPart = hash.substring(i % 32, (i % 32) + 8);
      const value = parseInt(hashPart, 16) / Math.pow(16, 8) * 2 - 1; // Range -1 to 1
      vector.push(value);
    }
    
    return vector;
  }

  // Create or update a collection
  public createCollection(name: string): void {
    console.log(`Creating collection '${name}'...`);
    if (!this.collections.has(name)) {
      this.collections.set(name, new Set());
      console.log(`Collection '${name}' created successfully.`);
    } else {
      console.log(`Collection '${name}' already exists.`);
    }
  }

  // Delete a collection
  public deleteCollection(name: string): boolean {
    if (!this.collections.has(name)) return false;
    
    // Delete all documents in the collection
    const docIds = this.collections.get(name);
    if (docIds) {
      docIds.forEach(id => this.documents.delete(id));
    }
    
    this.collections.delete(name);
    return true;
  }

  // List all collections
  public listCollections(): string[] {
    return Array.from(this.collections.keys());
  }

  // Add a document to a collection
  public async upsert(
    collectionName: string,
    documents: Omit<VectorDocument, 'vector'>[]
  ): Promise<string[]> {
    if (!this.collections.has(collectionName)) {
      this.createCollection(collectionName);
    }
    
    const collection = this.collections.get(collectionName)!;
    const ids: string[] = [];
    
    for (const doc of documents) {
      // Generate vector from document content
      const vector = this.textToVector(doc.content);
      
      // Store document with vector
      const fullDoc: VectorDocument = {
        ...doc,
        vector
      };
      
      this.documents.set(doc.id, fullDoc);
      collection.add(doc.id);
      ids.push(doc.id);
    }
    
    return ids;
  }

  // Delete documents from a collection
  public async delete(
    collectionName: string,
    ids: string[]
  ): Promise<string[]> {
    if (!this.collections.has(collectionName)) {
      return [];
    }
    
    const collection = this.collections.get(collectionName)!;
    const deletedIds: string[] = [];
    
    for (const id of ids) {
      if (collection.has(id)) {
        collection.delete(id);
        this.documents.delete(id);
        deletedIds.push(id);
      }
    }
    
    return deletedIds;
  }

  // Search for similar documents
  public async query(
    collectionName: string,
    query: string | VectorQuery,
    options: { topK?: number; filter?: Record<string, any> } = {}
  ): Promise<VectorSearchResult[]> {
    if (!this.collections.has(collectionName)) {
      return [];
    }
    
    const collection = this.collections.get(collectionName)!;
    const topK = options.topK || 10;
    const filter = options.filter || {};
    
    // Convert query to vector if it's a string
    const queryVector = typeof query === 'string' 
      ? this.textToVector(query)
      : query.vector;
    
    // Calculate similarity for all documents in the collection
    const scores: Array<{ id: string; score: number }> = [];
    
    // Convert Set to Array before iterating
    Array.from(collection).forEach(id => {
      const doc = this.documents.get(id);
      if (!doc || !doc.vector) return;
      
      // Apply filter if provided
      if (filter && Object.keys(filter).length > 0) {
        let matches = true;
        for (const [key, value] of Object.entries(filter)) {
          if (doc.metadata[key] !== value) {
            matches = false;
            break;
          }
        }
        if (!matches) return;
      }
      
      // Calculate similarity score
      const score = this.cosineSimilarity(queryVector, doc.vector);
      scores.push({ id, score });
    });
    
    // Sort by score (descending) and take top K
    scores.sort((a, b) => b.score - a.score);
    const topScores = scores.slice(0, topK);
    
    // Create result objects
    return topScores.map(({ id, score }) => {
      const doc = this.documents.get(id)!;
      return {
        id,
        content: doc.content,
        metadata: doc.metadata,
        score
      };
    });
  }
  
  // Get document by ID
  public async get(id: string): Promise<VectorDocument | null> {
    return this.documents.get(id) || null;
  }
  
  // Get multiple documents by their IDs
  public async getMany(ids: string[]): Promise<VectorDocument[]> {
    return ids
      .map(id => this.documents.get(id))
      .filter(Boolean) as VectorDocument[];
  }
  
  // Count documents in a collection
  public async count(collectionName: string): Promise<number> {
    if (!this.collections.has(collectionName)) {
      return 0;
    }
    
    return this.collections.get(collectionName)!.size;
  }
}

// Export a singleton instance
export const vectorDb = new InMemoryVectorDb();