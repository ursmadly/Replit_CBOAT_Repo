import { db } from './db';
import { 
  protocolDocuments, 
  protocolSections, 
  InsertProtocolDocument, 
  InsertProtocolSection,

  ProtocolDocument,
  ProtocolSection
} from '@shared/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Storage interface for Protocol Digitization feature
 */
export class ProtocolStorage {
  /**
   * Create a new protocol document
   * @param document Protocol document data
   * @returns Created protocol document
   */
  async createProtocolDocument(document: InsertProtocolDocument): Promise<ProtocolDocument> {
    const [createdDocument] = await db
      .insert(protocolDocuments)
      .values(document)
      .returning();
    return createdDocument;
  }

  /**
   * Get protocol document by ID
   * @param id Protocol document ID
   * @returns Protocol document or undefined if not found
   */
  async getProtocolDocumentById(id: number): Promise<ProtocolDocument | undefined> {
    const [document] = await db
      .select()
      .from(protocolDocuments)
      .where(eq(protocolDocuments.id, id));
    return document;
  }

  /**
   * Get protocol document by protocol ID
   * @param protocolId Protocol ID
   * @returns Protocol document or undefined if not found
   */
  async getProtocolDocumentByProtocolId(protocolId: string): Promise<ProtocolDocument | undefined> {
    const [document] = await db
      .select()
      .from(protocolDocuments)
      .where(eq(protocolDocuments.protocolId, protocolId));
    return document;
  }

  /**
   * Get all protocol documents
   * @returns Array of protocol documents
   */
  async getAllProtocolDocuments(): Promise<ProtocolDocument[]> {
    return db
      .select()
      .from(protocolDocuments)
      .orderBy(protocolDocuments.lastModified);
  }

  /**
   * Update protocol document
   * @param id Protocol document ID
   * @param updates Updates to apply
   * @returns Updated protocol document
   */
  async updateProtocolDocument(id: number, updates: Partial<Omit<InsertProtocolDocument, 'createdBy'>>): Promise<ProtocolDocument | undefined> {
    const [updatedDocument] = await db
      .update(protocolDocuments)
      .set({
        ...updates,
        lastModified: new Date()
      })
      .where(eq(protocolDocuments.id, id))
      .returning();
    return updatedDocument;
  }

  /**
   * Delete protocol document and all its sections
   * @param id Protocol document ID
   * @returns Boolean indicating success
   */
  async deleteProtocolDocument(id: number): Promise<boolean> {
    // First delete all sections
    await db
      .delete(protocolSections)
      .where(eq(protocolSections.documentId, id));

    // Then delete the document
    const result = await db
      .delete(protocolDocuments)
      .where(eq(protocolDocuments.id, id))
      .returning();
    
    return result.length > 0;
  }

  /**
   * Create protocol section
   * @param section Protocol section data
   * @returns Created protocol section
   */
  async createProtocolSection(section: InsertProtocolSection): Promise<ProtocolSection> {
    const [createdSection] = await db
      .insert(protocolSections)
      .values(section)
      .returning();
    return createdSection;
  }

  /**
   * Create multiple protocol sections in batch
   * @param sections Array of protocol section data
   * @returns Created protocol sections
   */
  async createProtocolSections(sections: InsertProtocolSection[]): Promise<ProtocolSection[]> {
    if (sections.length === 0) return [];
    
    return db
      .insert(protocolSections)
      .values(sections)
      .returning();
  }

  /**
   * Get all sections for a protocol document
   * @param documentId Protocol document ID
   * @returns Array of protocol sections
   */
  async getProtocolSections(documentId: number): Promise<ProtocolSection[]> {
    return db
      .select()
      .from(protocolSections)
      .where(eq(protocolSections.documentId, documentId))
      .orderBy(protocolSections.displayOrder);
  }

  /**
   * Get a specific section by its ID
   * @param sectionId Protocol section ID
   * @returns Protocol section or undefined if not found
   */
  async getProtocolSectionById(sectionId: number): Promise<ProtocolSection | undefined> {
    const [section] = await db
      .select()
      .from(protocolSections)
      .where(eq(protocolSections.id, sectionId));
    return section;
  }

  /**
   * Update protocol section
   * @param id Section ID
   * @param updates Updates to apply
   * @param editorUsername Username of the person making the edit
   * @returns Updated protocol section
   */
  async updateProtocolSection(
    id: number, 
    updates: Partial<Omit<InsertProtocolSection, 'documentId'>>,
    editorUsername: string
  ): Promise<ProtocolSection | undefined> {
    const [updatedSection] = await db
      .update(protocolSections)
      .set({
        ...updates,
        status: 'edited',
        updatedAt: new Date(),
        lastEditedBy: editorUsername
      })
      .where(eq(protocolSections.id, id))
      .returning();
    return updatedSection;
  }

  /**
   * Delete protocol section
   * @param id Protocol section ID
   * @returns Boolean indicating success
   */
  async deleteProtocolSection(id: number): Promise<boolean> {
    const result = await db
      .delete(protocolSections)
      .where(eq(protocolSections.id, id))
      .returning();
    
    return result.length > 0;
  }

  /**
   * Get protocol sections by category
   * @param documentId Protocol document ID
   * @param category Category name
   * @returns Protocol sections in the specified category
   */
  async getProtocolSectionsByCategory(documentId: number, category: string): Promise<ProtocolSection[]> {
    return db
      .select()
      .from(protocolSections)
      .where(
        and(
          eq(protocolSections.documentId, documentId),
          eq(protocolSections.category, category)
        )
      )
      .orderBy(protocolSections.displayOrder);
  }
}

// Export singleton instance
export const protocolStorage = new ProtocolStorage();