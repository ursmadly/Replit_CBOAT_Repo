import { Request as ExpressRequest, Response } from 'express';

// Extend the Express Request to include user from session
interface Request extends ExpressRequest {
  session: {
    user?: {
      id: number;
      username: string;
      role: string;
    }
  };
  user?: {
    id: number;
    username: string;
    role: string;
  };
}
import { z } from 'zod';
import { protocolStorage } from './protocolStorage';
import { insertProtocolDocumentSchema, insertProtocolSectionSchema } from '@shared/schema';

/**
 * Get all protocol documents
 * @param req Request
 * @param res Response
 */
export async function getAllProtocolDocuments(req: Request, res: Response) {
  try {
    const documents = await protocolStorage.getAllProtocolDocuments();
    res.status(200).json(documents);
  } catch (error) {
    console.error('Error getting protocol documents:', error);
    res.status(500).json({ error: 'Failed to get protocol documents' });
  }
}

/**
 * Get protocol document by ID
 * @param req Request with documentId
 * @param res Response
 */
export async function getProtocolDocumentById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const document = await protocolStorage.getProtocolDocumentById(Number(id));
    
    if (!document) {
      return res.status(404).json({ error: 'Protocol document not found' });
    }
    
    res.status(200).json(document);
  } catch (error) {
    console.error('Error getting protocol document:', error);
    res.status(500).json({ error: 'Failed to get protocol document' });
  }
}

/**
 * Get protocol document by protocol ID
 * @param req Request with protocolId
 * @param res Response
 */
export async function getProtocolDocumentByProtocolId(req: Request, res: Response) {
  try {
    const { protocolId } = req.params;
    const document = await protocolStorage.getProtocolDocumentByProtocolId(protocolId);
    
    if (!document) {
      return res.status(404).json({ error: 'Protocol document not found' });
    }
    
    res.status(200).json(document);
  } catch (error) {
    console.error('Error getting protocol document:', error);
    res.status(500).json({ error: 'Failed to get protocol document' });
  }
}

/**
 * Create a new protocol document
 * @param req Request with document data
 * @param res Response
 */
export async function createProtocolDocument(req: Request, res: Response) {
  try {
    // Get user from session
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate request body
    const validationResult = insertProtocolDocumentSchema.safeParse({
      ...req.body,
      createdBy: user.username
    });
    
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.message });
    }
    
    // Create document
    const document = await protocolStorage.createProtocolDocument(validationResult.data);
    res.status(201).json(document);
  } catch (error) {
    console.error('Error creating protocol document:', error);
    res.status(500).json({ error: 'Failed to create protocol document' });
  }
}

/**
 * Update protocol document
 * @param req Request with document data
 * @param res Response
 */
export async function updateProtocolDocument(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const document = await protocolStorage.getProtocolDocumentById(Number(id));
    
    if (!document) {
      return res.status(404).json({ error: 'Protocol document not found' });
    }
    
    const updatedDocument = await protocolStorage.updateProtocolDocument(Number(id), req.body);
    res.status(200).json(updatedDocument);
  } catch (error) {
    console.error('Error updating protocol document:', error);
    res.status(500).json({ error: 'Failed to update protocol document' });
  }
}

/**
 * Delete protocol document
 * @param req Request with documentId
 * @param res Response
 */
export async function deleteProtocolDocument(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const document = await protocolStorage.getProtocolDocumentById(Number(id));
    
    if (!document) {
      return res.status(404).json({ error: 'Protocol document not found' });
    }
    
    const result = await protocolStorage.deleteProtocolDocument(Number(id));
    
    if (result) {
      res.status(200).json({ message: 'Protocol document deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete protocol document' });
    }
  } catch (error) {
    console.error('Error deleting protocol document:', error);
    res.status(500).json({ error: 'Failed to delete protocol document' });
  }
}

/**
 * Get protocol sections by document ID
 * @param req Request with documentId
 * @param res Response
 */
export async function getProtocolSections(req: Request, res: Response) {
  try {
    const { documentId } = req.params;
    const sections = await protocolStorage.getProtocolSections(Number(documentId));
    res.status(200).json(sections);
  } catch (error) {
    console.error('Error getting protocol sections:', error);
    res.status(500).json({ error: 'Failed to get protocol sections' });
  }
}

/**
 * Create a new protocol section
 * @param req Request with section data
 * @param res Response
 */
export async function createProtocolSection(req: Request, res: Response) {
  try {
    // Get user from session
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate request body
    const validationResult = insertProtocolSectionSchema
      .extend({
        lastEditedBy: z.string().optional()
      })
      .safeParse({
        ...req.body,
        lastEditedBy: user.username
      });
    
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.message });
    }
    
    // Verify document exists
    const document = await protocolStorage.getProtocolDocumentById(validationResult.data.documentId);
    if (!document) {
      return res.status(404).json({ error: 'Protocol document not found' });
    }
    
    // Create section
    const section = await protocolStorage.createProtocolSection(validationResult.data);
    res.status(201).json(section);
  } catch (error) {
    console.error('Error creating protocol section:', error);
    res.status(500).json({ error: 'Failed to create protocol section' });
  }
}

/**
 * Create multiple protocol sections in batch
 * @param req Request with sections data
 * @param res Response
 */
export async function createProtocolSections(req: Request, res: Response) {
  try {
    // Get user from session
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate request body
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Request body must be an array of sections' });
    }
    
    const { documentId } = req.params;
    
    // Verify document exists
    const document = await protocolStorage.getProtocolDocumentById(Number(documentId));
    if (!document) {
      return res.status(404).json({ error: 'Protocol document not found' });
    }
    
    // Prepare sections data
    const sectionsData = req.body.map((section: any, index: number) => ({
      ...section,
      documentId: Number(documentId),
      displayOrder: index,
      lastEditedBy: user.username
    }));
    
    // Create sections
    const sections = await protocolStorage.createProtocolSections(sectionsData);
    res.status(201).json(sections);
  } catch (error) {
    console.error('Error creating protocol sections:', error);
    res.status(500).json({ error: 'Failed to create protocol sections' });
  }
}

/**
 * Update protocol section
 * @param req Request with section data
 * @param res Response
 */
export async function updateProtocolSection(req: Request, res: Response) {
  try {
    // Get user from session
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    const section = await protocolStorage.getProtocolSectionById(Number(id));
    
    if (!section) {
      return res.status(404).json({ error: 'Protocol section not found' });
    }
    
    const updatedSection = await protocolStorage.updateProtocolSection(
      Number(id), 
      req.body,
      user.username
    );
    
    res.status(200).json(updatedSection);
  } catch (error) {
    console.error('Error updating protocol section:', error);
    res.status(500).json({ error: 'Failed to update protocol section' });
  }
}

/**
 * Delete protocol section
 * @param req Request with sectionId
 * @param res Response
 */
export async function deleteProtocolSection(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const section = await protocolStorage.getProtocolSectionById(Number(id));
    
    if (!section) {
      return res.status(404).json({ error: 'Protocol section not found' });
    }
    
    const result = await protocolStorage.deleteProtocolSection(Number(id));
    
    if (result) {
      res.status(200).json({ message: 'Protocol section deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete protocol section' });
    }
  } catch (error) {
    console.error('Error deleting protocol section:', error);
    res.status(500).json({ error: 'Failed to delete protocol section' });
  }
}

/**
 * Get protocol sections by category
 * @param req Request with documentId and category
 * @param res Response
 */
export async function getProtocolSectionsByCategory(req: Request, res: Response) {
  try {
    const { documentId, category } = req.params;
    const sections = await protocolStorage.getProtocolSectionsByCategory(Number(documentId), category);
    res.status(200).json(sections);
  } catch (error) {
    console.error('Error getting protocol sections by category:', error);
    res.status(500).json({ error: 'Failed to get protocol sections by category' });
  }
}