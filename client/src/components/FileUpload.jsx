import { useState } from 'react';
import { toast } from 'react-toastify';

/**
 * Reusable File Upload Component
 * 
 * @param {object} props
 * @param {function} props.onUploadSuccess - Callback when upload succeeds (receives uploaded file URLs)
 * @param {function} props.onUploadStart - Optional callback when upload starts
 * @param {function} props.onUploadError - Optional callback when upload fails
 * @param {boolean} props.multiple - Allow multiple files
 * @param {string} props.accept - Accepted file types (e.g., 'image/*', '.pdf,.xlsx')
 * @param {number} props.maxFiles - Maximum number of files (for multiple uploads)
 * @param {number} props.maxSizeMB - Maximum file size in MB
 * @param {string} props.label - Label text
 * @param {string} props.buttonText - Button text
 * @param {string} props.className - Additional CSS classes
 */
function FileUpload({
    onUploadSuccess,
    onUploadStart,
    onUploadError,
    multiple = false,
    accept = '*/*',
    maxFiles = 5,
    maxSizeMB = 5,
    label = 'Choose File',
    buttonText = 'Upload',
    className = ''
}) {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [uploading, setUploading] = useState(false);

    // Handle file selection
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);

        // Validate number of files
        if (multiple && files.length > maxFiles) {
            toast.error(`Maximum ${maxFiles} files allowed`, { theme: 'dark' });
            return;
        }

        // Validate file sizes
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        const oversizedFiles = files.filter(file => file.size > maxSizeBytes);

        if (oversizedFiles.length > 0) {
            toast.error(`Files must be less than ${maxSizeMB}MB`, { theme: 'dark' });
            return;
        }

        setSelectedFiles(files);

        // Generate previews for images
        if (accept.includes('image')) {
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setPreviews(newPreviews);
        }
    };

    // Remove a file from selection
    const removeFile = (index) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        const newPreviews = previews.filter((_, i) => i !== index);
        setSelectedFiles(newFiles);
        setPreviews(newPreviews);
    };

    // Clear all files
    const clearFiles = () => {
        setSelectedFiles([]);
        setPreviews([]);
    };

    // Get file icon based on type
    const getFileIcon = (fileName) => {
        const ext = fileName.split('.').pop().toLowerCase();

        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
            return '🖼️';
        } else if (['pdf'].includes(ext)) {
            return '📄';
        } else if (['xls', 'xlsx'].includes(ext)) {
            return '📊';
        } else if (['doc', 'docx'].includes(ext)) {
            return '📝';
        }
        return '📎';
    };

    return (
        <div className={`file-upload-component ${className}`}>
            {/* File Input */}
            <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-white">
                    {label}
                </label>
                <input
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-400 border border-gray-600 rounded-lg cursor-pointer bg-gray-700 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    disabled={uploading}
                />
                <p className="mt-1 text-xs text-gray-400">
                    {multiple ? `Max ${maxFiles} files, ` : ''}
                    Max size: {maxSizeMB}MB
                </p>
            </div>

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
                <div className="mb-4 p-4 bg-gray-800 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-white">
                            Selected {multiple ? `(${selectedFiles.length})` : ''}:
                        </span>
                        <button
                            onClick={clearFiles}
                            className="text-xs text-red-400 hover:text-red-300"
                            type="button"
                        >
                            Clear All
                        </button>
                    </div>

                    <div className="space-y-2">
                        {selectedFiles.map((file, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-gray-700 rounded"
                            >
                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                    {/* Preview or Icon */}
                                    {previews[index] ? (
                                        <img
                                            src={previews[index]}
                                            alt="Preview"
                                            className="w-12 h-12 object-cover rounded"
                                        />
                                    ) : (
                                        <span className="text-2xl">{getFileIcon(file.name)}</span>
                                    )}

                                    {/* File Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white truncate">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>

                                {/* Remove Button */}
                                <button
                                    onClick={() => removeFile(index)}
                                    className="ml-2 text-red-400 hover:text-red-300"
                                    type="button"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default FileUpload;
