// Example MCP Tool Implementation
// Shows a complete tool: schema definition, handler, and service-layer call with RLS.

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

// ── Schema (input validation) ──────────────────────────────────────

const GetGoalSchema = z.object({
  goal_id: z.string().uuid().describe('The goal ID to retrieve'),
})

// ── Service Layer ──────────────────────────────────────────────────
// CRITICAL: Use createUserClient, NOT createClient(url, userToken).
// See references/oauth-flow.md Pattern C for explanation.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

function createUserClient(userToken: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${userToken}` } },
  })
}

interface GoalRow {
  id: string
  user_id: string
  title: string
  selected_vision: string
  is_deleted: boolean
}

async function getGoalById(userToken: string, goalId: string): Promise<GoalRow | null> {
  const supabase = createUserClient(userToken)

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('id', goalId)
    .eq('is_deleted', false)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // not found
    throw error
  }

  return data as GoalRow
}

// ── Tool Handler ───────────────────────────────────────────────────
// This is what gets registered in the tool registry.

interface ToolContext {
  userId: string
  token: string
  requestId: string
}

export default {
  name: 'get_goal',
  description: 'Get details of a specific goal by ID',
  inputSchema: GetGoalSchema,
  scope: 'read:goals',

  async handler(args: z.infer<typeof GetGoalSchema>, context: ToolContext) {
    const goal = await getGoalById(context.token, args.goal_id)

    if (!goal) {
      return {
        success: false,
        error: { code: -32001, message: `Goal not found: ${args.goal_id}` },
      }
    }

    return {
      success: true,
      data: {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              id: goal.id,
              title: goal.title,
              vision: goal.selected_vision,
            }, null, 2),
          },
        ],
      },
    }
  },
}

// ── Registry Registration Pattern ──────────────────────────────────
// In mcp/registry.ts, register the tool like this:
//
// import getGoal from '../tools/getGoal.ts'
//
// const toolRegistry = new ToolRegistry()
// toolRegistry.register(getGoal)
