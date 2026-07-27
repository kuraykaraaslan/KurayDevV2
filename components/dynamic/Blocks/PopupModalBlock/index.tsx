'use client'

import { usePathname } from 'next/navigation'
import type { BlockDefinition } from '../../types'
import { EditorPreview } from './EditorPreview'
import { PopupOverlay } from './PopupOverlay'

function PopupModalBlock(rawProps: Record<string, unknown>) {
  const pathname = usePathname()
  if (pathname?.includes('/admin/pages/')) return <EditorPreview rawProps={rawProps} />
  return <PopupOverlay rawProps={rawProps} />
}

export const PopupModalBlockDefinition: BlockDefinition = {
  type: 'popup-modal',
  label: 'Popup Modal',
  category: 'System',
  description: 'Site-wide popup overlay. Add to any published page — renders as a fixed overlay on the frontend.',
  icon: '🪟',
  tags: ['popup', 'modal', 'overlay', 'announcement'],
  defaultProps: {
    title: '',
    description: '',
    image: '',
    imageAction: '',
    imageActionUrl: '',
    imageActionOpenNewTab: false,
    buttons: [
      { text: 'Learn more', link: '/', variant: 'filled', bgColor: 'var(--color-primary)', textColor: 'var(--color-primary-content)', openNewTab: false },
    ],
    size: 'md',
    position: 'center',
    backgroundColor: 'var(--color-neutral)',
    overlayOpacity: 65,
    borderRadius: 'lg',
    entryAnimation: 'zoom',
    entryDuration: 0.35,
    exitAnimation: 'fade',
    exitDuration: 0.22,
    visibleOn: 'all',
    closeButtonPosition: 'top-right',
    closeButtonStyle: 'circle',
    closeButtonSize: 'md',
    closeButtonColor: '#ffffff',
    closeButtonBg: '#00000066',
    startDate: '',
    endDate: '',
    frequency: 'EVERY_TIME',
    showDelay: 0,
    isActive: true,
  },
  schema: {
    // --- Content ---
    title: { label: 'Title', type: 'text', group: 'Content' },
    description: { label: 'Description', type: 'textarea', group: 'Content' },
    image: { label: 'Image', type: 'img', uploadFolder: 'modals', group: 'Content' },
    imageAction: {
      label: 'Image Action', type: 'select', group: 'Content', options: [
        { label: 'None', value: '' },
        { label: 'Link', value: 'link' },
      ]
    },
    imageActionOpenNewTab: { label: 'Image Action Open New Tab', type: 'boolean', group: 'Content', value: false },
    imageActionUrl: { label: 'Image Action URL', type: 'url', group: 'Content' },
    // --- Buttons ---
    buttons: {
      label: 'Buttons', type: 'repeater',
      description: 'Zero buttons = only the close icon is shown (if enabled).',
      group: 'Buttons',
      fields: {
        text: { label: 'Label', type: 'text', value: 'Learn more' },
        link: { label: 'URL', type: 'url', value: '/' },
        openNewTab: { label: 'New tab', type: 'boolean', value: false },
        variant: {
          label: 'Style', type: 'select', value: 'filled', options: [
            { label: 'Filled', value: 'filled' },
            { label: 'Outlined', value: 'outlined' },
            { label: 'Ghost', value: 'ghost' },
          ]
        },
        bgColor: { label: 'Color', type: 'color', value: 'var(--color-primary)' },
        textColor: { label: 'Text color', type: 'color', value: 'var(--color-primary-content)' },
      },
    },

    // --- Appearance ---
    size: {
      label: 'Size', type: 'select', group: 'Appearance',
      options: [
        { label: 'Small  (400px)', value: 'sm' },
        { label: 'Medium (600px)', value: 'md' },
        { label: 'Large  (800px)', value: 'lg' },
        { label: 'Fullscreen', value: 'fullscreen' },
      ],
    },
    position: {
      label: 'Position', type: 'select', group: 'Appearance',
      options: [
        { label: 'Center', value: 'center' },
        { label: 'Bottom center', value: 'bottom-center' },
        { label: 'Bottom right', value: 'bottom-right' },
        { label: 'Top center', value: 'top-center' },
      ],
    },
    visibleOn: {
      label: 'Visible on', type: 'select', group: 'Appearance',
      options: [
        { label: 'All devices', value: 'all' },
        { label: 'Mobile only', value: 'mobile' },
        { label: 'Tablet only', value: 'tablet' },
        { label: 'Desktop only', value: 'desktop' },
        { label: 'Mobile & Tablet', value: 'mobile-tablet' },
        { label: 'Tablet & Desktop', value: 'tablet-desktop' },
      ],
    },
    backgroundColor: { label: 'Background color', type: 'color', group: 'Appearance' },
    overlayOpacity: { label: 'Overlay opacity (0–100)', type: 'number', min: 0, max: 100, step: 5, group: 'Appearance' },
    borderRadius: {
      label: 'Border radius', type: 'select', group: 'Appearance',
      options: [
        { label: 'None', value: 'none' }, { label: 'Small', value: 'sm' },
        { label: 'Medium', value: 'md' }, { label: 'Large', value: 'lg' }, { label: 'XL', value: 'xl' },
      ],
    },

    // --- Animation ---
    entryAnimation: {
      label: 'Entry animation', type: 'select', group: 'Animation',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Fade', value: 'fade' },
        { label: 'Zoom', value: 'zoom' },
        { label: 'Slide up', value: 'slide-up' },
        { label: 'Slide down', value: 'slide-down' },
        { label: 'Slide left', value: 'slide-left' },
        { label: 'Slide right', value: 'slide-right' },
        { label: 'Flip', value: 'flip' },
      ],
    },
    entryDuration: {
      label: 'Entry duration (s)', type: 'number',
      min: 0.1, max: 5, step: 0.05, group: 'Animation',
    },
    exitAnimation: {
      label: 'Exit animation', type: 'select', group: 'Animation',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Fade', value: 'fade' },
        { label: 'Zoom', value: 'zoom' },
        { label: 'Slide up', value: 'slide-up' },
        { label: 'Slide down', value: 'slide-down' },
        { label: 'Slide left', value: 'slide-left' },
        { label: 'Slide right', value: 'slide-right' },
        { label: 'Flip', value: 'flip' },
      ],
    },
    exitDuration: {
      label: 'Exit duration (s)', type: 'number',
      min: 0.1, max: 5, step: 0.05, group: 'Animation',
    },

    // --- Close button ---
    closeButtonPosition: {
      label: 'Position', type: 'select', group: 'Close button',
      options: [
        { label: 'Top right', value: 'top-right' },
        { label: 'Top left', value: 'top-left' },
        { label: 'Bottom right', value: 'bottom-right' },
        { label: 'Bottom left', value: 'bottom-left' },
        { label: 'Hidden', value: 'hidden' },
      ],
    },
    closeButtonStyle: {
      label: 'Style', type: 'select', group: 'Close button',
      options: [
        { label: 'Circle', value: 'circle' },
        { label: 'Square', value: 'square' },
        { label: 'Minimal', value: 'minimal' },
      ],
    },
    closeButtonSize: {
      label: 'Size', type: 'select', group: 'Close button',
      options: [
        { label: 'Small', value: 'sm' },
        { label: 'Medium', value: 'md' },
        { label: 'Large', value: 'lg' },
      ],
    },
    closeButtonColor: { label: 'Icon color', type: 'color', group: 'Close button' },
    closeButtonBg: {
      label: 'Background color', type: 'color', group: 'Close button',
      description: 'Used for Circle and Square styles.'
    },

    // --- Scheduling ---
    isActive: { label: 'Active', type: 'boolean', group: 'Scheduling' },
    startDate: { label: 'Start date', type: 'datetime', group: 'Scheduling', description: 'Leave empty to show from now.' },
    endDate: { label: 'End date', type: 'datetime', group: 'Scheduling', description: 'Leave empty to show indefinitely.' },
    frequency: {
      label: 'Display frequency', type: 'select', group: 'Scheduling',
      options: [
        { label: 'Always', value: 'EVERY_TIME' },
        { label: 'Once (permanent)', value: 'ONCE' },
        { label: 'Once per session', value: 'SESSION' },
      ],
    },
    showDelay: { label: 'Show delay (seconds)', type: 'number', min: 0, max: 60, step: 1, group: 'Scheduling' },
  },
  Component: PopupModalBlock as unknown as BlockDefinition['Component'],
}

export default PopupModalBlock
