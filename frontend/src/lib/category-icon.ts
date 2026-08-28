const ICONS_BY_CATEGORY: Record<string, string> = {
  "Ẩm thực": "🍜",
  "Làm đẹp": "💄",
  "Giải trí": "🎬",
  "Du lịch": "✈️",
  "Thời trang": "👕",
  "Sức khỏe": "💪",
  "Công nghệ": "📱",
  "Thể thao": "⚽",
};

export function getCategoryIcon(categoryName?: string) {
  if (!categoryName) return "🎟";
  return ICONS_BY_CATEGORY[categoryName] ?? "🎟";
}
