import { Injectable, Logger } from '@nestjs/common'
import { prisma } from '@flowchat/database'
import { AiService } from '../ai.service'

export interface KnowledgeEntry {
  id: string
  tenantId: string
  type: string
  title: string
  content: string
  embedding: number[] | null
  metadata: Record<string, unknown>
  createdAt: Date
}

interface SearchResult {
  entry: KnowledgeEntry
  score: number
}

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name)

  constructor(private readonly aiService: AiService) {}

  async addEntry(
    tenantId: string,
    type: string,
    title: string,
    content: string,
    metadata: Record<string, unknown> = {},
  ): Promise<string> {
    let embedding: number[] | null = null

    try {
      const result = await this.aiService.embed(
        `${title}\n\n${content}`.slice(0, 8000),
      )
      embedding = result.embedding
    } catch (error) {
      this.logger.warn(
        `Failed to generate embedding: ${error instanceof Error ? error.message : String(error)}`,
      )
    }

    const event = await prisma.analyticsEvent.create({
      data: {
        tenantId,
        eventType: 'knowledge_entry',
        entityType: type,
        entityId: title,
        properties: {
          title,
          content,
          embedding,
          metadata,
        } as object,
      },
    })

    this.logger.log(`Knowledge entry added: ${title} (${type}) for tenant ${tenantId}`)
    return event.id
  }

  async removeEntry(tenantId: string, entryId: string): Promise<void> {
    await prisma.analyticsEvent.deleteMany({
      where: {
        id: entryId,
        tenantId,
        eventType: 'knowledge_entry',
      },
    })
  }

  async listEntries(tenantId: string): Promise<KnowledgeEntry[]> {
    const events = await prisma.analyticsEvent.findMany({
      where: { tenantId, eventType: 'knowledge_entry' },
      orderBy: { createdAt: 'desc' },
    })

    return events.map((e: { id: string; tenantId: string; entityType: string | null; properties: unknown; createdAt: Date }) => {
      const props = e.properties as Record<string, unknown>
      return {
        id: e.id,
        tenantId: e.tenantId,
        type: e.entityType ?? 'text',
        title: (props.title as string) ?? '',
        content: (props.content as string) ?? '',
        embedding: (props.embedding as number[]) ?? null,
        metadata: (props.metadata as Record<string, unknown>) ?? {},
        createdAt: e.createdAt,
      }
    })
  }

  async search(
    tenantId: string,
    query: string,
    topK: number = 5,
  ): Promise<SearchResult[]> {
    const entries = await this.listEntries(tenantId)

    if (entries.length === 0) return []

    let queryEmbedding: number[] | null = null
    try {
      const result = await this.aiService.embed(query)
      queryEmbedding = result.embedding
    } catch {
      return this.fallbackTextSearch(entries, query, topK)
    }

    if (!queryEmbedding) {
      return this.fallbackTextSearch(entries, query, topK)
    }

    const scored = entries
      .filter((entry) => entry.embedding !== null)
      .map((entry) => ({
        entry,
        score: this.cosineSimilarity(queryEmbedding!, entry.embedding!),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)

    return scored.filter((s) => s.score > 0.3)
  }

  async buildContext(
    tenantId: string,
    query: string,
    maxTokens: number = 2000,
  ): Promise<string> {
    const results = await this.search(tenantId, query, 5)

    if (results.length === 0) return ''

    let context = ''
    let estimatedTokens = 0

    for (const result of results) {
      const chunk = `[${result.entry.title}]\n${result.entry.content}\n\n`
      const chunkTokens = Math.ceil(chunk.length / 4)

      if (estimatedTokens + chunkTokens > maxTokens) break

      context += chunk
      estimatedTokens += chunkTokens
    }

    return context.trim()
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB)
    if (denominator === 0) return 0

    return dotProduct / denominator
  }

  private fallbackTextSearch(
    entries: KnowledgeEntry[],
    query: string,
    topK: number,
  ): SearchResult[] {
    const queryLower = query.toLowerCase()
    const words = queryLower.split(/\s+/)

    return entries
      .map((entry) => {
        const text = `${entry.title} ${entry.content}`.toLowerCase()
        const matchCount = words.filter((w) => text.includes(w)).length
        const score = matchCount / words.length
        return { entry, score }
      })
      .filter((s) => s.score > 0.2)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
  }
}
