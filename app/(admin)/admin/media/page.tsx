'use client'
import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUpload,
  faTrash,
  faSpinner,
  faCopy,
  faCheck,
  faFolder,
  faFilter,
  faArrowsRotate,
  faPen,
} from '@fortawesome/free-solid-svg-icons'
import axiosInstance from '@/libs/axios'
import { useTranslation } from 'react-i18next'
import {
  TableProvider,
  TableHeader,
  TableBody,
  TableFooter,
  useTableContext,
  GridItemRenderProps,
  ColumnDef,
  ActionButton,
} from '@/components/admin/UI/Forms/DynamicTable'
import { HeadlessModal, useModal } from '@/components/admin/UI/Modal'
import { MediaFile } from '@/types/features/MediaTypes'

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Edit Modal
function MediaEditModal({
  item,
  open,
  onClose,
  onSaved,
}: {
  item: MediaFile | null
  open: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [altText, setAltText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (item) {
      setName(item.name || '')
      setAltText(item.altText || '')
    }
  }, [item])

  const handleSave = async () => {
    if (!item) return
    setSaving(true)
    try {
      await axiosInstance.patch(`/api/media/${item.mediaId}`, { name, altText })
      onSaved()
      onClose()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <HeadlessModal
      open={open}
      onClose={onClose}
      title={t('admin.media.edit')}
      size="md"
    >
      {item && (
        <div className="flex flex-col gap-4">
          {/* Preview */}
          <div className="flex gap-4 items-start">
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-base-200 shrink-0">
              <img src={item.url} alt={item.altText || item.key} className="w-full h-full object-cover" />
            </div>
            <div className="text-sm text-base-content/60 space-y-1 min-w-0">
              <p className="truncate font-medium text-base-content" title={item.key}>
                {item.originalName || item.key.split('/').pop()}
              </p>
              <p>{formatFileSize(item.size)}</p>
              <p className="badge badge-ghost badge-sm">{item.folder}</p>
              {item.mimeType && <p>{item.mimeType}</p>}
            </div>
          </div>

          {/* Name */}
          <label className="form-control w-full">
            <div className="label">
              <span className="label-text">{t('admin.media.name')}</span>
            </div>
            <input
              type="text"
              className="input input-bordered w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={item.key.split('/').pop()}
            />
          </label>

          {/* Alt Text */}
          <label className="form-control w-full">
            <div className="label">
              <span className="label-text">{t('admin.media.alt_text')}</span>
            </div>
            <input
              type="text"
              className="input input-bordered w-full"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder={t('admin.media.alt_text_placeholder')}
            />
          </label>

          {/* URL (read-only) */}
          <label className="form-control w-full">
            <div className="label">
              <span className="label-text">{t('admin.media.copy_url')}</span>
            </div>
            <div className="input input-bordered flex items-center gap-2 bg-base-200">
              <span className="text-sm truncate flex-1 text-base-content/60">{item.url}</span>
              <button
                type="button"
                className="btn btn-ghost btn-xs shrink-0"
                onClick={() => navigator.clipboard.writeText(item.url)}
              >
                <FontAwesomeIcon icon={faCopy} />
              </button>
            </div>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={saving}>
              {t('common.cancel')}
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              {saving && <FontAwesomeIcon icon={faSpinner} spin />}
              {t('common.save')}
            </button>
          </div>
        </div>
      )}
    </HeadlessModal>
  )
}

// Grid Item Component
function MediaGridItem({
  item,
  handleActionClick,
  actions,
}: GridItemRenderProps<MediaFile>) {
  const { t } = useTranslation()
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const deleteAction = actions?.find((a) => a.label === 'admin.media.delete')
  const editAction = actions?.find((a) => a.label === 'admin.media.edit')

  return (
    <div className="group relative bg-base-200 rounded-lg border border-base-300 overflow-hidden transition-all hover:border-primary/50">
      {/* Image */}
      <div className="aspect-square bg-base-300 relative overflow-hidden">
        <img
          src={item.url}
          alt={item.altText || item.key}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          {editAction && (
            <button
              className="btn btn-circle btn-sm btn-ghost text-white"
              onClick={() => handleActionClick(editAction, item)}
              title={t('admin.media.edit')}
            >
              <FontAwesomeIcon icon={faPen} />
            </button>
          )}
          <button
            className="btn btn-circle btn-sm btn-ghost text-white"
            onClick={() => copyToClipboard(item.url)}
            title={t('admin.media.copy_url')}
          >
            <FontAwesomeIcon icon={copiedUrl === item.url ? faCheck : faCopy} />
          </button>
          {deleteAction && (
            <button
              className="btn btn-circle btn-sm btn-error"
              onClick={() => handleActionClick(deleteAction, item)}
              title={t('admin.media.delete')}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-2">
        <p className="text-xs text-base-content/70 truncate" title={item.key}>
          {item.name || item.key.split('/').pop()}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-base-content/40">{formatFileSize(item.size)}</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-base-content/5 rounded text-base-content/50">
            {item.folder}
          </span>
        </div>
      </div>
    </div>
  )
}

// Upload & Filter Toolbar - rendered inside TableHeader
function MediaToolbarContent({ isDebug }: { isDebug: boolean }) {
  const { t } = useTranslation()
  const { refetch } = useTableContext<MediaFile>()
  const [uploading, setUploading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [folders, setFolders] = useState<string[]>([])
  const [selectedFolder, setSelectedFolder] = useState('')

  useEffect(() => {
    axiosInstance.get('/api/media?pageSize=1').then((res) => {
      setFolders(res.data.folders || [])
    })
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', selectedFolder || 'general')

      await axiosInstance.post('/api/media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      refetch()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await axiosInstance.post('/api/media/sync')
      alert(res.data.message)
      refetch()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <>
      {/* Upload Button */}
      <label className="btn btn-primary btn-sm gap-2">
        <FontAwesomeIcon icon={uploading ? faSpinner : faUpload} spin={uploading} />
        {t('admin.media.upload')}
        <input
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
        />
      </label>

      {/* Sync Button — only visible when ?debug=1 */}
      {isDebug && (
        <button className="btn btn-outline btn-sm gap-2" onClick={handleSync} disabled={syncing}>
          <FontAwesomeIcon icon={syncing ? faSpinner : faArrowsRotate} spin={syncing} />
          {t('admin.media.sync')}
        </button>
      )}

      {/* Folder Filter */}
      <div className="dropdown">
        <label tabIndex={0} className="btn btn-outline btn-sm gap-2">
          <FontAwesomeIcon icon={faFilter} />
          {selectedFolder || t('admin.media.all_folders')}
        </label>
        <ul
          tabIndex={0}
          className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
        >
          <li>
            <a onClick={() => setSelectedFolder('')}>{t('admin.media.all_folders')}</a>
          </li>
          {folders.map((folder) => (
            <li key={folder}>
              <a onClick={() => setSelectedFolder(folder)}>
                <FontAwesomeIcon icon={faFolder} className="w-3 h-3" />
                {folder}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

// Image Cell for Table View
function MediaImageCell({ url, alt }: { url: string; alt: string }) {
  return (
    <div className="w-12 h-12 rounded overflow-hidden bg-base-300">
      <img src={url} alt={alt} className="w-full h-full object-cover" loading="lazy" />
    </div>
  )
}

// Copy URL Cell
function CopyUrlCell({ url }: { url: string }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      className="btn btn-ghost btn-xs"
      onClick={copyToClipboard}
      title={t('admin.media.copy_url')}
    >
      <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
    </button>
  )
}

export default function MediaLibraryPage() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const isDebug = searchParams.get('debug') === '1'

  const { open, openModal, closeModal } = useModal()
  const [editItem, setEditItem] = useState<MediaFile | null>(null)

  const columns: ColumnDef<MediaFile>[] = [
    {
      key: 'preview',
      header: 'admin.media.preview',
      accessor: (item) => <MediaImageCell url={item.url} alt={item.altText || item.key} />,
      className: 'w-16',
    },
    {
      key: 'filename',
      header: 'admin.media.filename',
      accessor: (item) => (
        <span className="text-sm truncate max-w-[200px] block" title={item.key}>
          {item.name || item.key.split('/').pop()}
        </span>
      ),
    },
    {
      key: 'folder',
      header: 'admin.media.folder',
      accessor: (item) => <span className="badge badge-ghost badge-sm">{item.folder}</span>,
    },
    {
      key: 'size',
      header: 'admin.media.size',
      accessor: (item) => (
        <span className="text-sm text-base-content/70">{formatFileSize(item.size)}</span>
      ),
    },
    {
      key: 'date',
      header: 'admin.media.date',
      accessor: (item) => (
        <span className="text-sm text-base-content/50">{formatDate(item.createdAt)}</span>
      ),
    },
    {
      key: 'copy',
      header: 'admin.media.copy_url',
      accessor: (item) => <CopyUrlCell url={item.url} />,
      className: 'w-16',
    },
  ]

  const handleDelete = useCallback(
    async (item: MediaFile) => {
      if (!confirm(t('admin.media.confirm_delete'))) {
        throw new Error('Cancelled')
      }
      await axiosInstance.delete('/api/media', { data: { key: item.key } })
    },
    [t]
  )

  const handleEdit = useCallback(
    async (item: MediaFile) => {
      setEditItem(item)
      openModal()
    },
    [openModal]
  )

  const actions: ActionButton<MediaFile>[] = [
    {
      label: 'admin.media.edit',
      onClick: handleEdit,
      className: 'btn-ghost btn-outline',
    },
    {
      label: 'admin.media.delete',
      onClick: handleDelete,
      className: 'btn-error btn-outline',
    },
  ]

  const gridItemRenderer = useCallback(
    (props: GridItemRenderProps<MediaFile>) => <MediaGridItem {...props} />,
    []
  )

  return (
    <div className="w-full">
      <TableProvider<MediaFile>
        apiEndpoint="/api/media"
        dataKey="files"
        idKey="key"
        columns={columns}
        actions={actions}
        pageSize={24}
        defaultViewMode="grid"
        gridItemRenderer={gridItemRenderer}
        gridClassName="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
      >
        <TableHeader
          title="admin.media.title"
          searchPlaceholder="admin.media.search_placeholder"
          showViewToggle
          showRefresh
          toolbarContent={<MediaToolbarContent isDebug={isDebug} />}
          toolbarPosition="before-search"
        />
        <TableBody emptyText="admin.media.no_files" />
        <TableFooter showingText="admin.media.showing" />

        <MediaEditModalWrapper
          item={editItem}
          open={open}
          onClose={closeModal}
        />
      </TableProvider>
    </div>
  )
}

// Wrapper to access refetch from TableContext inside TableProvider
function MediaEditModalWrapper({
  item,
  open,
  onClose,
}: {
  item: MediaFile | null
  open: boolean
  onClose: () => void
}) {
  const { refetch } = useTableContext<MediaFile>()

  return (
    <MediaEditModal
      item={item}
      open={open}
      onClose={onClose}
      onSaved={refetch}
    />
  )
}
