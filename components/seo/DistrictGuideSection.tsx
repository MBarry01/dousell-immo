/**
 * District Guide Section
 *
 * Displays rich neighborhood content including guide, price trends,
 * amenities, and FAQ for improved SEO and user engagement.
 */

import { getDistrictGuide } from '@/lib/seo/districtGuides'
import { Markdown } from '@/components/ui/markdown'

interface DistrictGuideSectionProps {
  districtSlug: string
  cityName: string
}

export async function DistrictGuideSection({ districtSlug, cityName }: DistrictGuideSectionProps) {
  const guide = getDistrictGuide(districtSlug)

  if (!guide) {
    return null
  }

  return (
    <div className="space-y-12 py-12 border-t border-white/10">
      {/* ===================================================================== */}
      {/* Header */}
      {/* ===================================================================== */}

      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold text-[#F4C430] mb-4">
          Guide Immobilier : {guide.name}
        </h2>
        <p className="text-white/80 text-lg">{guide.description}</p>
      </div>

      {/* ===================================================================== */}
      {/* Main Guide Content */}
      {/* ===================================================================== */}

      <div className="max-w-4xl mx-auto bg-white/5 rounded-2xl border border-white/10 p-8">
        <div className="prose prose-invert max-w-none">
          <Markdown content={guide.guide} />
        </div>
      </div>

      {/* ===================================================================== */}
      {/* Price Trend */}
      {/* ===================================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="bg-[#F4C430]/10 rounded-xl border border-[#F4C430]/20 p-6">
          <h3 className="text-xl font-bold text-[#F4C430] mb-4">📊 Tendance des Prix</h3>
          <div className="text-white/80 text-sm space-y-2 whitespace-pre-wrap">
            {guide.priceTrend}
          </div>
        </div>

        {/* Amenities */}
        <div className="bg-blue-500/10 rounded-xl border border-blue-500/20 p-6">
          <h3 className="text-xl font-bold text-blue-400 mb-4">🏢 Équipements & Services</h3>
          <ul className="space-y-2">
            {guide.amenities.map((amenity, i) => (
              <li key={i} className="text-white/80 flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">✓</span>
                <span>{amenity}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* Why Invest */}
      {/* ===================================================================== */}

      <div className="max-w-4xl mx-auto bg-green-500/10 rounded-xl border border-green-500/20 p-8">
        <h3 className="text-2xl font-bold text-green-400 mb-6">💰 Pourquoi Investir à {guide.name}?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guide.whyInvest.map((reason, i) => (
            <div key={i} className="flex gap-3">
              <div className="text-green-400 font-bold text-xl flex-shrink-0">→</div>
              <p className="text-white/80">{reason}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* FAQ */}
      {/* ===================================================================== */}

      <div className="max-w-4xl mx-auto">
        <h3 className="text-2xl font-bold text-white mb-6">❓ Questions Fréquentes</h3>
        <div className="space-y-4">
          {guide.faq.map((item, i) => (
            <details
              key={i}
              className="group bg-white/5 border border-white/10 rounded-lg overflow-hidden hover:bg-white/10 transition-colors"
            >
              <summary className="p-4 cursor-pointer flex items-center justify-between">
                <h4 className="font-semibold text-white pr-4">{item.question}</h4>
                <span className="text-[#F4C430] group-open:rotate-180 transition-transform flex-shrink-0">
                  ▼
                </span>
              </summary>
              <div className="px-4 pb-4 border-t border-white/10 text-white/80 pt-4">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  )
}
