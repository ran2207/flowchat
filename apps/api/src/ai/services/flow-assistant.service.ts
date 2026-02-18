import { Injectable } from '@nestjs/common'
import { AiService } from '../ai.service'
import type { AiProvider } from '../ai.types'

export interface GeneratedFlow {
  nodes: Record<
    string,
    {
      id: string
      type: string
      config: Record<string, unknown>
      position: { x: number; y: number }
    }
  >
  edges: Array<{
    source: string
    target: string
    sourceHandle?: string
  }>
  variables: Array<{ name: string; defaultValue: unknown }>
}

const FLOW_SYSTEM_PROMPT = `You are an expert automation flow builder. When given a description, generate a valid flow definition JSON.

Available node types:
TRIGGERS: trigger_keyword, trigger_comment, trigger_story_mention, trigger_webhook, trigger_schedule, trigger_manual
MESSAGES: send_text, send_image, send_video, send_buttons, send_quick_replies, send_carousel
ACTIONS: action_add_tag, action_remove_tag, action_set_field, action_subscribe_sequence, action_unsubscribe_sequence, action_http_request, action_notify_agent, action_assign_agent, action_go_to_flow
LOGIC: condition, random_split, smart_delay, wait_for_input, date_time_condition
AI: ai_intent_match, ai_reply, ai_step

Node config examples:
- trigger_keyword: { keywords: ["hello", "start"], matchType: "contains" }
- send_text: { text: "Hello {{contact.first_name}}!", typingDelay: 1000 }
- send_buttons: { text: "Choose an option:", buttons: [{ title: "Option A", type: "postback", payload: "opt_a" }] }
- condition: { rules: [{ field: "contact.tag", operator: "equals", value: "vip" }], logic: "and" }
- smart_delay: { duration: 5, unit: "minutes" }
- action_add_tag: { tagName: "interested" }
- ai_reply: { model: "gpt-4o-mini", prompt: "Answer customer questions about our product", maxTurns: 3 }

Response format:
{
  "nodes": {
    "node_1": { "id": "node_1", "type": "trigger_keyword", "config": {...}, "position": { "x": 0, "y": 0 } },
    "node_2": { "id": "node_2", "type": "send_text", "config": {...}, "position": { "x": 0, "y": 150 } }
  },
  "edges": [
    { "source": "node_1", "target": "node_2", "sourceHandle": "default" }
  ],
  "variables": []
}

Rules:
1. Every flow MUST start with a trigger node
2. Position nodes vertically with ~150px spacing
3. For condition nodes, use sourceHandle "yes" and "no" for the two branches
4. Use meaningful node IDs like "trigger_1", "msg_welcome", "check_vip"
5. Keep flows practical and not overly complex`

@Injectable()
export class FlowAssistantService {
  constructor(private readonly aiService: AiService) {}

  async generateFlow(
    description: string,
    provider?: AiProvider,
  ): Promise<GeneratedFlow> {
    const prompt = `Create an automation flow for the following description:

"${description}"

Generate the complete flow definition JSON.`

    const result = await this.aiService.generateJson<GeneratedFlow>(prompt, {
      provider,
      systemPrompt: FLOW_SYSTEM_PROMPT,
      temperature: 0.3,
      maxTokens: 2048,
    })

    this.validateFlow(result)

    return result
  }

  async refineFlow(
    currentFlow: GeneratedFlow,
    instruction: string,
    provider?: AiProvider,
  ): Promise<GeneratedFlow> {
    const prompt = `Here is the current flow definition:

${JSON.stringify(currentFlow, null, 2)}

User instruction: "${instruction}"

Modify the flow according to the instruction. Return the complete updated flow definition JSON.`

    const result = await this.aiService.generateJson<GeneratedFlow>(prompt, {
      provider,
      systemPrompt: FLOW_SYSTEM_PROMPT,
      temperature: 0.3,
      maxTokens: 2048,
    })

    this.validateFlow(result)

    return result
  }

  async describeFlow(flow: GeneratedFlow, provider?: AiProvider): Promise<string> {
    const prompt = `Describe what this automation flow does in plain English. Be concise (2-3 sentences).

Flow definition:
${JSON.stringify(flow, null, 2)}`

    const result = await this.aiService.complete(
      [{ role: 'user', content: prompt }],
      {
        provider,
        systemPrompt: 'You describe automation flows in clear, simple language.',
        temperature: 0.5,
        maxTokens: 256,
      },
    )

    return result.text.trim()
  }

  private validateFlow(flow: GeneratedFlow): void {
    if (!flow.nodes || typeof flow.nodes !== 'object') {
      throw new Error('Invalid flow: missing nodes')
    }

    if (!Array.isArray(flow.edges)) {
      throw new Error('Invalid flow: missing edges array')
    }

    const nodeIds = new Set(Object.keys(flow.nodes))

    const hasTrigger = Object.values(flow.nodes).some((n) =>
      n.type.startsWith('trigger_'),
    )
    if (!hasTrigger) {
      throw new Error('Invalid flow: must have at least one trigger node')
    }

    for (const edge of flow.edges) {
      if (!nodeIds.has(edge.source)) {
        throw new Error(`Invalid flow: edge references unknown source node "${edge.source}"`)
      }
      if (!nodeIds.has(edge.target)) {
        throw new Error(`Invalid flow: edge references unknown target node "${edge.target}"`)
      }
    }
  }
}
