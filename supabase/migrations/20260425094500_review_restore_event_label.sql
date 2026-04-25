update public.review_events
set label = 'Restored suggestion'
where event_kind = 'suggestion_restored'
  and label = 'Restored AI suggestion';
