-- [BẮT ĐẦU SQL] --
-- Kích hoạt Realtime Broadcast cho bảng messages qua Publication mặc định của Supabase
BEGIN;
  DO $$ 
  BEGIN
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    END IF;
  END $$;
COMMIT;
-- [KẾT THÚC SQL] --
