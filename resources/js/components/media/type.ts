export type UploadProgressType = {
    percentage?: number;
    rate?: number;
};
export type MediaUploaderTriggerProps = {
    progress: UploadProgressType;
    status: 'error' | 'idle' | 'pending' | 'success';
    open: () => void;
};
