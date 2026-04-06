import type { Company, TourResource, TourCategoryResource } from '@/api/model';
import TenantLayout from '@/components/layouts/tenant-layout';
import { SearchIcon } from 'lucide-react';
import { useState } from 'react';
import { EmptyTours } from './empty-tours';
import TourCard from './dashboard/vendor-tours/components/TourCard';

export type AgentTour = {
  id: number;
  company_id: number;
  category_id?: number;
  company: Company;
  tour: TourResource;
};

function TourCard({ agentTour }: { agentTour: AgentTour }) {
  const floatingChat = useFloatingChatWidgetContext();
  const [startingPrivateChat, setStartingPrivateChat] = useState(false);
  const hasDocument = Boolean(agentTour.tour.document);
  const { src, srcSet } = extractImageSrc(agentTour.tour.image as any);

  const handleMessage = async () => {
    try {
      setStartingPrivateChat(true);
      floatingChat.setAttachment({
        type: 'tour',
        data: `${agentTour.tour.id}`,
      });
      await floatingChat.startPrivateChat({
        type: 'company',
        id: agentTour.company_id,
      });
    } finally {
      setStartingPrivateChat(false);
    }
  };

  return (
    <Card className="relative mx-auto w-full overflow-hidden pt-0">
      <img
        src={src}
        srcSet={srcSet}
        alt="Event cover"
        className="relative z-20 aspect-video w-full object-cover"
      />
      <CardHeader>
        <CardTitle>{agentTour.tour.name}</CardTitle>
        <CardDescription>{agentTour.tour.description}</CardDescription>
      </CardHeader>
      <CardFooter className="flex gap-2">
        <Button variant="secondary" className="flex-1" disabled={!hasDocument}>
          <IconPdf />
          <span className="hidden md:inline">Brochures</span>
        </Button>
        <Button
          type="button"
          onClick={handleMessage}
          disabled={startingPrivateChat}
          variant="secondary"
          className="flex-1"
        >
          {startingPrivateChat ? <Spinner /> : <MessageSquareIcon />}
        </Button>
      </CardFooter>
    </Card>
  );
}

type ArticlePageProps = {
  data: AgentTour[];
  company: Company;
  vendor: Company;
  username: string;
  categories: TourCategoryResource[];
  phone: string;
};

export default function Page({ data, categories }: ArticlePageProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<number | ''>('');

  const filteredData = data.filter((item) => {
    const matchSearch = item.tour.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === '' ? true : item.category_id === category;
    return matchSearch && matchCategory;
  });

  return (
    <TenantLayout>
      <div className="px-4 mt-4">
        <div className="mx-auto relative w-full max-w-md">
          <input
            type="text"
            placeholder="Cari tour..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border bg-background px-4 py-2 pr-10 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <SearchIcon
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-4 pt-4 px-4 justify-center">
        <button
          onClick={() => setCategory('')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition
          ${
            category === ''
              ? 'bg-primary text-white'
              : 'bg-muted hover:bg-muted/70'
          }`}
        >
          Semua
        </button>

        {categories?.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
            active:scale-95
            ${
              category === cat.id
                ? 'bg-primary text-white hover:bg-primary/90'
                : 'bg-muted hover:bg-muted/70'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {filteredData.length ? (
        <div className="space-y-4 p-4">
          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredData.map((item) => (
              <TourCard key={item.id} tour={item.tour} fromLogin={false} />
            ))}
          </div>
        </div>
      ) : (
        <EmptyTours />
      )}
    </TenantLayout>
  );
}
