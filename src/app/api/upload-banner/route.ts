export const runtime = 'edge';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/admin';

const MAX_SIZE = 300 * 1024; // 300 KB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const BUCKET = 'banners';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdminEmail(user?.email)) {
    return Response.json({ error: '관리자만 업로드할 수 있습니다' }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get('file') as File | null;

  if (!file) return Response.json({ error: '파일이 없습니다' }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return Response.json({ error: 'JPG, PNG, WebP, GIF만 업로드 가능합니다' }, { status: 400 });
  if (file.size > MAX_SIZE) return Response.json({ error: `파일이 너무 큽니다 (최대 300KB, 현재 ${Math.round(file.size / 1024)}KB)` }, { status: 400 });

  const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
  const filename = `banner-${Date.now()}.${ext}`;

  const service = createServiceClient();
  const bytes = await file.arrayBuffer();

  const { error } = await service.storage
    .from(BUCKET)
    .upload(filename, bytes, { contentType: file.type, upsert: true });

  if (error) {
    // Storage bucket이 없으면 명확한 메시지 반환
    if (error.message.includes('not found') || error.message.includes('bucket')) {
      return Response.json({ error: 'Supabase Storage "banners" 버킷이 없습니다. 버킷을 먼저 생성하세요.' }, { status: 500 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = service.storage.from(BUCKET).getPublicUrl(filename);

  return Response.json({ url: urlData.publicUrl });
}
