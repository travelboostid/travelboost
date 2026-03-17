import { SearchIcon, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import TourCard from '@/pages/companies/dashboard/vendor-tours/components/TourCard'
import { EmptyTours } from '@/pages/companies/dashboard/vendor-tours/empty-tours'

import PublicCatalogLayout from '@/layouts/PublicCatalogLayout'

type Props = {
  username: string
  data: any[]
  categories: any[]
  vendor: any
}

export default function Page({
  username,
  data,
  categories,
  vendor,
}: Props) {
  const [search, setSearch] = useState('')

  const [activeCategory, setActiveCategory] = useState<number | null>(null)

  // 🔎 Filter client-side (public simple version)
  const filteredTours = data.filter((tour) => {
    const name = (tour.name || '').toLowerCase()
    const matchSearch = name.includes(search.toLowerCase())

    const matchCategory =
      !activeCategory || tour.category_id === activeCategory

    return matchSearch && matchCategory
  })

  // 📱 WhatsApp
  const waNumber = vendor?.phone

  const waMessage = encodeURIComponent(
    `Halo, saya melihat katalog tour dari ${username}. Mohon info lebih lanjut.`
  )

  const waUrl = waNumber
    ? `https://wa.me/${waNumber}?text=${waMessage}`
    : null

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">{vendor.name}</h1>
        <p className="text-gray-500">Katalog Tour</p>
      </div>

      {/* SEARCH */}
      <div className="relative w-full max-w-md">
        <input
          type="text"
          placeholder="Cari tour..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-full border px-4 py-2 pr-10 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <SearchIcon
          size={18}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
      </div>

      {/* CATEGORY (optional display) */}
      {categories?.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">

          {/* Semua */}
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition
              ${
                activeCategory === null
                  ? 'bg-primary text-white'
                  : 'bg-muted hover:bg-muted/70'
              }`}
          >
            Semua
          </button>

          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition
                ${
                  activeCategory === c.id
                    ? 'bg-primary text-white'
                    : 'bg-muted hover:bg-muted/70'
                }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* GRID */}
      {filteredTours.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTours.map((tour) => (
            <TourCard key={tour.id} tour={tour} type={vendor.type} />
          ))}
        </div>
      ) : (
        <EmptyTours />
      )}

      {/* WHATSAPP FLOATING BUTTON */}
      {waUrl && (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-25 right-6 z-50 flex items-center gap-2 rounded-full bg-green-500 px-5 py-3 text-white shadow-lg hover:bg-green-600"
        >
          <MessageCircle />
          
        </a>
      )}
    </div>
  )
}

Page.layout = (page: React.ReactNode) => (
  <PublicCatalogLayout>{page}</PublicCatalogLayout>
)