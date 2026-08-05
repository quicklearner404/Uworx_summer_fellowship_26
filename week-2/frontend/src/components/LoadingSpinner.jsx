export default function LoadingSpinner() {
    return (
        <div className="mt-12 flex flex-col items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900"></div>

            <p className="mt-4 text-gray-600">
                Analyzing repository...
            </p>
        </div>
    );
}