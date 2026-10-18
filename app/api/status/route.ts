export const dynamic='force-dynamic';
export async function GET() {
  return Response.json({
    mode:'rosie-agent',homeChat:Boolean(process.env.OPENROUTER_API_KEY),learning:'prewritten',roleVoice:Boolean(process.env.CARTESIA_API_KEY),
    guideVoice:Boolean(process.env.EDGE_TTS_URL),
    storage:process.env.SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY?'supabase':process.env.NODE_ENV==='production'?'missing':'local',
    session:process.env.NODE_ENV!=='production'||Boolean(process.env.SESSION_SECRET)
  },{headers:{'Cache-Control':'no-store'}});
}
