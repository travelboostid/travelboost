import { Button } from '@/components/ui/button';

import { triggerGenerateKnowledgeBase } from '@/routes/admin/database/medias';
import { router } from '@inertiajs/react';
import { BookIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function GenerateKnowledgeBaseButton({ data }: { data: any }) {
    const [loading, setLoading] = useState(false);

    const handleSubmit = () => {
        router.post(
            triggerGenerateKnowledgeBase(data.id).url,
            {},
            {
                onBefore: () => {
                    setLoading(true);
                },
                onSuccess: () => {
                    toast.success(
                        'Media knowledge base generated successfully.',
                    );
                },
                onError: () => {
                    toast.error(
                        'Failed to generate media knowledge base. Please try again.',
                    );
                },
                onFinish: () => {
                    setLoading(false);
                },
            },
        );
    };

    return (
        <Button size="icon" onClick={handleSubmit} disabled={loading}>
            <BookIcon />
        </Button>
    );
}
