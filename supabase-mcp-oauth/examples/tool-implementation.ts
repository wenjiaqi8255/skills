// Example MCP Tool Implementation (Deno runtime — Supabase Edge Functions)
// Shows dual-mode DB access: RLS (default) or admin (for identity-mapped users).

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

function createUserClient(userToken: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${userToken}` } },
  })
}

function createAdminClient() {
  return createClient(supabaseUrl, serviceRoleKey)
}

// ── Schema ──────────────────────────────────────────────────────────

const GetGoalSchema = z.object({
  goal_id: z.string().uuid().describe('The goal ID to retrieve'),
})

// ── Service Layer (Dual-Mode) ───────────────────────────────────────
// canonicalUserId present → admin mode (service role + explicit user_id filter)
// canonicalUserId absent  → RLS mode (user JWT, RLS enforces auth.uid() = user_id)

interface GoalRow {
  id: string
  user_id: string
  title: string
  selected_vision: string
  is_deleted: boolean
}

async function getGoalById(
  userToken: string,
  goalId: string,
  canonicalUserId?: string,
): Promise<GoalRow | null> {
  const useAdmin = !!canonicalUserId
  const supabase = useAdmin ? createAdminClient() : createUserClient(userToken)

  let query = supabase
    .from('goals')
    .select('*')
    .eq('id', goalId)
    .eq('is_deleted', false)

  if (useAdmin) {
    query = query.eq('user_id', canonicalUserId!)
  }

  const { data, error } = await query.single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data as GoalRow
}

// ── Tool Context ────────────────────────────────────────────────────
// The dispatcher provides canonicalUserId from the user identity mapping.

interface ToolContext {
  userId: string
  canonicalUserId: string
  token: string
  requestId: string
}

// ── Tool Handler ────────────────────────────────────────────────────
// Returns { success, data } — the dispatcher wraps in MCP content format.

export default {
  name: 'get_goal',
  description: 'Get details of a specific goal by ID',
  inputSchema: GetGoalSchema,
  scope: 'read:goals',

  async handler(args: z.infer<typeof GetGoalSchema>, context: ToolContext) {
    const goal = await getGoalById(
      context.token,
      args.goal_id,
      context.canonicalUserId,
    )

    if (!goal) {
      return {
        success: false,
        error: { code: -32001, message: `Goal not found: ${args.goal_id}` },
      }
    }

    return {
      success: true,
      data: {
        id: goal.id,
        title: goal.title,
        vision: goal.selected_vision,
      },
    }
  },
}
