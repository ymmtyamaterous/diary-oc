import type { DiaryEntry, PublicDiaryEntry } from "@/lib/types";
import { apiFileUrl } from "@/lib/api";

type Props = {
  entry: DiaryEntry | PublicDiaryEntry;
  showActions?: boolean;
  onToggle?: () => void;
  onDelete?: () => void;
};

const weatherIcon: Record<string, string> = {
  sunny: "☀️",
  cloudy: "☁️",
  rainy: "🌧️",
  snowy: "❄️",
  stormy: "⛈️",
  foggy: "🌫️",
  "partly-cloudy": "⛅",
  windy: "💨",
};

export function DiaryCard({ entry, showActions = false, onToggle, onDelete }: Props) {
  const imageUrl = apiFileUrl("image_url" in entry ? entry.image_url : null);
  const audioUrl = apiFileUrl("audio_url" in entry ? entry.audio_url : null);
  const weather = entry.weather ? `${weatherIcon[entry.weather] ?? "🌤️"} ${entry.weather}` : "";

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-500">
        <div className="flex items-center gap-2">
          {"author_name" in entry ? <span>👤 {entry.author_name}</span> : null}
          <span>{new Date(entry.date).toLocaleDateString("ja-JP")}</span>
          {weather ? <span>{weather}</span> : null}
        </div>
        {"is_public" in entry ? (
          <span className={`rounded px-2 py-0.5 text-xs ${entry.is_public ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"}`}>
            {entry.is_public ? "公開中" : "非公開"}
          </span>
        ) : null}
      </div>

      {entry.content ? <p className="mb-3 whitespace-pre-wrap">{entry.content}</p> : null}

      <div className="grid gap-2 text-sm">
        {entry.events ? <p>📝 出来事: {entry.events}</p> : null}
        {entry.emotions ? <p>💭 感情: {entry.emotions}</p> : null}
        {entry.good_things ? <p>😊 よかったこと: {entry.good_things}</p> : null}
        {entry.reflections ? <p>🤔 反省点: {entry.reflections}</p> : null}
        {entry.gratitude ? <p>🙏 感謝したこと: {entry.gratitude}</p> : null}
        {entry.tomorrow_goals ? <p>🎯 明日の目標: {entry.tomorrow_goals}</p> : null}
        {entry.tomorrow_looking_forward ? <p>✨ 明日の楽しみ: {entry.tomorrow_looking_forward}</p> : null}
        {entry.learnings ? <p>💡 学んだこと: {entry.learnings}</p> : null}
        {entry.health_habits ? <p>💪 健康・習慣: {entry.health_habits}</p> : null}
        {entry.today_in_one_word ? <p>🏷️ 一言: {entry.today_in_one_word}</p> : null}
      </div>

      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="日記画像" className="mt-3 max-h-64 w-full rounded-lg object-cover" />
      ) : null}

      {audioUrl ? (
        <audio controls className="mt-3 w-full">
          <source src={audioUrl} />
        </audio>
      ) : null}

      {showActions ? (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="rounded bg-amber-500 px-3 py-1.5 text-sm text-white hover:bg-amber-600"
          >
            {"is_public" in entry && entry.is_public ? "非公開にする" : "公開にする"}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded bg-rose-500 px-3 py-1.5 text-sm text-white hover:bg-rose-600"
          >
            削除
          </button>
        </div>
      ) : null}
    </article>
  );
}
