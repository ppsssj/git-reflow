interface IconProps {
  name: string;
  className?: string;
}

const iconPaths: Record<string, string> = {
  add: 'M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z',
  add_circle:
    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-4H7v-2h4V7h2v4h4v2h-4v4Z',
  analytics: 'M5 19h3V9H5v10Zm5 0h3V5h-3v14Zm5 0h3v-7h-3v7Z',
  archive:
    'M4 4h16v4H4V4Zm2 6h12v9a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-9Zm4 2v2h4v-2h-4Z',
  architecture: 'M4 5h16v2H4V5Zm2 4h12v2H6V9Zm2 4h8v2H8v-2Zm2 4h4v2h-4v-2Z',
  arrow_forward: 'M12 4l1.4 1.4L8.8 10H20v2H8.8l4.6 4.6L12 18 5 11l7-7Z',
  blur_on:
    'M7 7a1.5 1.5 0 1 0 0 .01V7Zm5-2a1.5 1.5 0 1 0 0 .01V5Zm5 2a1.5 1.5 0 1 0 0 .01V7ZM7 12a1.5 1.5 0 1 0 0 .01V12Zm5 0a1.5 1.5 0 1 0 0 .01V12Zm5 0a1.5 1.5 0 1 0 0 .01V12ZM7 17a1.5 1.5 0 1 0 0 .01V17Zm5 2a1.5 1.5 0 1 0 0 .01V19Zm5-2a1.5 1.5 0 1 0 0 .01V17Z',
  bolt: 'M13 2 5 13h6l-1 9 8-12h-6l1-8Z',
  campaign:
    'M4 10v4h3l6 4V6l-6 4H4Zm12-2v8h2V8h-2ZM6 12h2.2l2.8-1.9v3.8L8.2 12H6Z',
  chat_bubble:
    'M5 4h14v10H8l-4 4V5a1 1 0 0 1 1-1Zm1 2v7.2L7.2 12H17V6H6Z',
  check_box: 'M5 5h14v14H5V5Zm6 10 5-5-1.4-1.4L11 12.2 9.4 10.6 8 12l3 3Z',
  check_box_outline_blank: 'M5 5h14v14H5V5Zm2 2v10h10V7H7Z',
  cloud_done:
    'M7 18a5 5 0 0 1 .6-10A6 6 0 0 1 19 10.2 4 4 0 0 1 18 18H7Zm4-3 5-5-1.4-1.4L11 12.2 9.4 10.6 8 12l3 3Z',
  code: 'M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4Zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4Z',
  dashboard_customize:
    'M4 4h7v7H4V4Zm9 0h7v5h-7V4ZM4 13h7v7H4v-7Zm9-2h7v9h-7v-9Z',
  devices: 'M3 5h14v10H3V5Zm2 2v6h10V7H5Zm13 3h3v8h-8v-2h6v-4h-1v-2Z',
  dock_to_left: 'M4 5h16v14H4V5Zm2 2v10h4V7H6Zm6 0v10h6V7h-6Z',
  dock_to_right: 'M4 5h16v14H4V5Zm2 2v10h6V7H6Zm8 0v10h4V7h-4Z',
  explore:
    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm3.5 6.5-2 5-5 2 2-5 5-2Z',
  extension:
    'M8 4h5v3h2a3 3 0 1 1 0 6h-2v3H8v-3H5v-2h3V8H5V6h3V4Zm2 2v10h1v-5h4a1 1 0 1 0 0-2h-4V6h-1Z',
  filter_alt: 'M4 5h16l-6 7v5l-4 2v-7L4 5Z',
  folder:
    'M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Zm2 2v10h14V8H5Z',
  fork_right:
    'M7 4a3 3 0 1 0 2 2.8V8a2 2 0 0 0 2 2h4.2A3 3 0 1 0 15 8h-4a4 4 0 0 1-2-.54V6.8A3 3 0 0 0 7 4Zm0 2a1 1 0 1 1 0 2 1 1 0 0 1 0-2Zm10 4a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z',
  grid_view: 'M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z',
  help_outline:
    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1 15h2v-2h-2v2Zm1-12a4 4 0 0 0-4 4h2a2 2 0 1 1 3.1 1.7c-1.2.8-2.1 1.5-2.1 3.3h2c0-.8.4-1.1 1.3-1.8A3.8 3.8 0 0 0 12 5Z',
  history:
    'M12 4a8 8 0 1 1-7.4 5H2l3.5-3.5L9 9H6.7A6 6 0 1 0 12 6V4Zm-1 3h2v5l4 2-1 1.7-5-3V7Z',
  image:
    'M4 5h16v14H4V5Zm2 2v8.5l3.5-3.5 2.5 2.5 3.5-4.5L18 13.2V7H6Zm2 2.5A1.5 1.5 0 1 0 8 9.5Z',
  inbox:
    'M4 4h16v12a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V4Zm2 2v7h4l1 2h2l1-2h4V6H6Z',
  inventory_2:
    'M4 4h16v5H4V4Zm2 7h12v8H6v-8Zm3 2v2h6v-2H9Z',
  keyboard_arrow_down: 'M7.4 8.6 12 13.2l4.6-4.6L18 10l-6 6-6-6 1.4-1.4Z',
  keyboard_arrow_up: 'M7.4 15.4 12 10.8l4.6 4.6L18 14l-6-6-6 6 1.4 1.4Z',
  list: 'M5 7h14v2H5V7Zm0 4h14v2H5v-2Zm0 4h14v2H5v-2Z',
  menu: 'M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h16v2H4v-2Z',
  merge_type:
    'M7 4a3 3 0 1 0-2 2.83v10.34a3 3 0 1 0 2 0V13a4 4 0 0 0 4-4V6.83A3 3 0 1 0 9 4v5a2 2 0 0 1-2 2V6.83A3 3 0 0 0 7 4Zm-2 0a1 1 0 1 1 2 0 1 1 0 0 1-2 0Zm6 0a1 1 0 1 1 2 0 1 1 0 0 1-2 0ZM5 20a1 1 0 1 1 2 0 1 1 0 0 1-2 0Z',
  more_vert: 'M12 8a2 2 0 1 0 0 .01V8Zm0 4a2 2 0 1 0 0 .01V12Zm0 4a2 2 0 1 0 0 .01V16Z',
  near_me: 'M12 2 4 21l8-4 8 4-8-19Z',
  notifications:
    'M12 22a2.5 2.5 0 0 0 2.4-2h-4.8a2.5 2.5 0 0 0 2.4 2Zm7-5-2-2V10a5 5 0 0 0-10 0v5l-2 2v1h14v-1Z',
  open_in_new: 'M5 5h7v2H7v10h10v-5h2v7H5V5Zm9 0h5v5h-2V8.4l-6.3 6.3-1.4-1.4L15.6 7H14V5Z',
  pan_tool:
    'M7 11V5a1 1 0 0 1 2 0v5h1V3a1 1 0 1 1 2 0v7h1V4a1 1 0 1 1 2 0v7h1V7a1 1 0 1 1 2 0v7a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-4.2-1.8L3 15a1.5 1.5 0 0 1 2.1-2.1L7 14.8V11Z',
  push_pin: 'M14 3l7 7-2 2-2-2-4 4v4l-1 1-4-4-4 4-1-1 4-4-4-4 1-1h4l4-4-2-2 2-2Z',
  radio_button_unchecked: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z',
  restart_alt:
    'M12 5a7 7 0 1 1-6.3 4H3l3.5-3.5L10 9H7.8A5 5 0 1 0 12 7V5Z',
  search:
    'M10 4a6 6 0 1 0 3.7 10.7l3.8 3.8 1.4-1.4-3.8-3.8A6 6 0 0 0 10 4Zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z',
  sell:
    'M4 4h7l9 9-7 7-9-9V4Zm3 2a1 1 0 1 0 0 .01V6Zm6 11 4-4-6.8-6.8H6v4.2L13 17Z',
  send: 'M3 20 21 12 3 4v6l10 2-10 2v6Z',
  settings:
    'M19.4 13.5a7.8 7.8 0 0 0 0-3l2-1.5-2-3.5-2.4 1a8.2 8.2 0 0 0-2.6-1.5L14 2h-4l-.4 3a8.2 8.2 0 0 0-2.6 1.5l-2.4-1-2 3.5 2 1.5a7.8 7.8 0 0 0 0 3l-2 1.5 2 3.5 2.4-1a8.2 8.2 0 0 0 2.6 1.5l.4 3h4l.4-3a8.2 8.2 0 0 0 2.6-1.5l2.4 1 2-3.5-2-1.5ZM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z',
  smart_toy:
    'M11 3h2v3h4a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h4V3Zm-4 5a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H7Zm2 4a1.5 1.5 0 1 0 0 .01V12Zm6 0a1.5 1.5 0 1 0 0 .01V12Zm-5 3h4v-2h-4v2Z',
  star:
    'm12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z',
  swap_horiz: 'M7 7h11l-3-3 1.4-1.4L22 8l-5.6 5.4L15 12l3-3H7V7Zm10 10H6l3 3-1.4 1.4L2 16l5.6-5.4L9 12l-3 3h11v2Z',
  sync: 'M12 4a8 8 0 0 1 7.4 5H17l3.5 3.5L24 9h-2.5A10 10 0 0 0 4 5.8L5.4 7.2A8 8 0 0 1 12 4Zm-7.4 11H7l-3.5-3.5L0 15h2.5A10 10 0 0 0 20 18.2l-1.4-1.4A8 8 0 0 1 4.6 15Z',
  sync_alt: 'M7 7h11l-3-3 1.4-1.4L22 8l-5.6 5.4L15 12l3-3H7V7Zm10 10H6l3 3-1.4 1.4L2 16l5.6-5.4L9 12l-3 3h11v2Z',
  terminal: 'M4 5h16v14H4V5Zm2 3v2l3 2-3 2v2l5-4-5-4Zm7 6v2h5v-2h-5Z',
  tune: 'M4 7h10v2H4V7Zm12 0h4v2h-4V7ZM4 15h4v2H4v-2Zm6 0h10v2H10v-2Zm2-10h2v6h-2V5Zm-4 8h2v6H8v-6Z',
  unfold_more_double: 'M7 6l5-5 5 5-1.4 1.4L12 3.8 8.4 7.4 7 6Zm0 12 5 5 5-5-1.4-1.4-3.6 3.6-3.6-3.6L7 18Z',
  verified_user:
    'M12 2 5 5v6c0 4.4 3 8.4 7 9.8 4-1.4 7-5.4 7-9.8V5l-7-3Zm-1 13-3-3 1.4-1.4 1.6 1.6 4.6-4.6L17 9l-6 6Z',
  view_agenda: 'M4 5h16v6H4V5Zm0 8h16v6H4v-6Z',
  visibility:
    'M12 5c5 0 8.5 5 9 7-.5 2-4 7-9 7s-8.5-5-9-7c.5-2 4-7 9-7Zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z',
  visibility_off:
    'M4.3 3 21 19.7 19.7 21l-3-3A9.8 9.8 0 0 1 12 19c-5 0-8.5-5-9-7 .3-1.1 1.5-3 3.2-4.5L3 4.3 4.3 3Zm6 6 4.7 4.7A4 4 0 0 0 10.3 9ZM12 5c5 0 8.5 5 9 7-.2.9-1 2.2-2.2 3.5L16.7 13A4 4 0 0 0 11 7.3L8.8 5.1A10 10 0 0 1 12 5Z',
  web_asset: 'M4 5h16v14H4V5Zm2 4v8h12V9H6Zm0-2h12V7H6Z',
  zoom_in:
    'M10 4a6 6 0 1 0 3.7 10.7l3.8 3.8 1.4-1.4-3.8-3.8A6 6 0 0 0 10 4Zm-1 3h2v2h2v2h-2v2H9v-2H7V9h2V7Z',
  zoom_out:
    'M10 4a6 6 0 1 0 3.7 10.7l3.8 3.8 1.4-1.4-3.8-3.8A6 6 0 0 0 10 4Zm-3 5h6v2H7V9Z',
};

export function Icon({ name, className = '' }: IconProps) {
  const path = iconPaths[name] ?? 'M5 5h14v14H5V5Zm2 2v10h10V7H7Z';

  return (
    <svg
      className={['material-symbols-outlined', className].join(' ').trim()}
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
    >
      <path d={path} fill="currentColor" />
    </svg>
  );
}
