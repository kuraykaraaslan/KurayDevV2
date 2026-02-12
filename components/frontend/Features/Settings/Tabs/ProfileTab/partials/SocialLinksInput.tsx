'use client'

import { useMemo } from 'react'
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { SocialLinks, SocialLinkItem, SingleSocialLinkEnum } from '@/types/user/UserProfileTypes'

/* ------------------------------------------------
   Sortable Row
------------------------------------------------- */
function SortableRow({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, attributes, listeners, transform, transition } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab px-2 text-base-content/50"
        title="Sürükle"
      >
        ☰
      </button>
      {children}
    </div>
  )
}

/* ------------------------------------------------
   Main Component
------------------------------------------------- */
type Props = {
  value: SocialLinks
  onChange: (links: SocialLinks) => void
}

export default function SocialLinksInput({ value, onChange }: Props) {
  const sorted = useMemo(() => [...value].sort((a, b) => a.order - b.order), [value])

  /* ---------- DND ---------- */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sorted.findIndex((x) => x.id === active.id)
    const newIndex = sorted.findIndex((x) => x.id === over.id)

    const reordered = arrayMove(sorted, oldIndex, newIndex).map((item, index) => ({
      ...item,
      order: index,
    }))

    onChange(reordered)
  }

  /* ---------- ADD ---------- */
  const addLink = () => {
    onChange([
      ...sorted,
      {
        id: crypto.randomUUID(),
        platform: 'GITHUB',
        url: null,
        order: sorted.length,
      },
    ])
  }

  /* ---------- UPDATE ---------- */
  const updateItem = (id: string, patch: Partial<SocialLinkItem>) => {
    onChange(sorted.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  /* ---------- DELETE ---------- */
  const deleteItem = (id: string) => {
    const filtered = sorted.filter((x) => x.id !== id).map((x, i) => ({ ...x, order: i }))

    onChange(filtered)
  }

  return (
    <div className="form-control w-full space-y-3">
      <label className="label flex justify-between items-center">
        <span className="label-text font-semibold">Sosyal Medya Bağlantıları</span>
        <button type="button" className="btn btn-xs btn-outline" onClick={addLink}>
          Bağlantı Ekle
        </button>
      </label>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sorted.map((x) => x.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {sorted.map((item) => (
              <SortableRow key={item.id} id={item.id}>
                <select
                  className="select select-bordered w-36"
                  value={item.platform}
                  onChange={(e) =>
                    updateItem(item.id, {
                      platform: e.target.value as SocialLinkItem['platform'],
                    })
                  }
                >
                  {SingleSocialLinkEnum.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>

                <input
                  type="url"
                  className="input input-bordered flex-1"
                  placeholder={`${item.platform} URL`}
                  value={item.url ?? ''}
                  onChange={(e) => updateItem(item.id, { url: e.target.value })}
                />

                <button
                  type="button"
                  className="btn btn-sm btn-outline btn-error"
                  onClick={() => deleteItem(item.id)}
                >
                  Delete
                </button>
              </SortableRow>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
