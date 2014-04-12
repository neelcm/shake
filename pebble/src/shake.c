#include "pebble.h"

static Window *window;

static TextLayer *name_layer;
static TextLayer *phone_layer;
static BitmapLayer *icon_layer;
static GBitmap *icon_bitmap = NULL;

static AppSync sync;
static uint8_t sync_buffer[64];

enum ShakeKeys {
  ID_KEY = 0x0,         // TUPLE_INT
  NAME_KEY = 0x1,  // TUPLE_CSTRING
  PHONE_KEY = 0x2
};


static void sync_error_callback(DictionaryResult dict_error, AppMessageResult app_message_error, void *context) {
  APP_LOG(APP_LOG_LEVEL_DEBUG, "App Message Sync Error: %d", app_message_error);
}

static void sync_tuple_changed_callback(const uint32_t key, const Tuple* new_tuple, const Tuple* old_tuple, void* context) {
  switch (key) {
    case ID_KEY:
      // App Sync keeps new_tuple in sync_buffer, so we may use it directly
      //text_layer_set_text(id_layer, new_tuple->value->cstring);
      break;

    case NAME_KEY:
      text_layer_set_text(name_layer, new_tuple->value->cstring);
      break;

    case PHONE_KEY:
    text_layer_set_text(phone_layer, new_tuple->value->cstring);
    break;
  }
}


static void send_cmd(void) {
  Tuplet value = TupletInteger(1, 1);

  DictionaryIterator *iter;
  app_message_outbox_begin(&iter);

  if (iter == NULL) {
    return;
  }

  dict_write_tuplet(iter, &value);
  dict_write_end(iter);

  app_message_outbox_send();
}

static void window_load(Window *window) {
  Layer *window_layer = window_get_root_layer(window);

  icon_layer = bitmap_layer_create(GRect(32, 10, 80, 80));
  layer_add_child(window_layer, bitmap_layer_get_layer(icon_layer));

  name_layer = text_layer_create(GRect(0, 55, 144, 68));
  text_layer_set_text_color(name_layer, GColorBlack);
  text_layer_set_background_color(name_layer, GColorClear);
  text_layer_set_font(name_layer, fonts_get_system_font(FONT_KEY_GOTHIC_28_BOLD));
  text_layer_set_text_alignment(name_layer, GTextAlignmentCenter);
  layer_add_child(window_layer, text_layer_get_layer(name_layer));

  phone_layer = text_layer_create(GRect(0, 135, 144, 68));
  text_layer_set_text_color(phone_layer, GColorBlack);
  text_layer_set_background_color(phone_layer, GColorClear);
  text_layer_set_font(phone_layer, fonts_get_system_font(FONT_KEY_GOTHIC_28_BOLD));
  text_layer_set_text_alignment(phone_layer, GTextAlignmentCenter);
  layer_add_child(window_layer, text_layer_get_layer(phone_layer));


  Tuplet initial_values[] = {
    TupletInteger(ID_KEY, (uint8_t) 1),
    TupletCString(NAME_KEY, "Neel M."),
    TupletCString(PHONE_KEY, "4083183895")
  };

  app_sync_init(&sync, sync_buffer, sizeof(sync_buffer), initial_values, ARRAY_LENGTH(initial_values),
      sync_tuple_changed_callback, sync_error_callback, NULL);

  send_cmd();
}

static void window_unload(Window *window) {
  app_sync_deinit(&sync);

  if (icon_bitmap) {
    gbitmap_destroy(icon_bitmap);
  }

  text_layer_destroy(phone_layer);
  text_layer_destroy(name_layer);
  bitmap_layer_destroy(icon_layer);
}

static void init(void) {
  window = window_create();
  window_set_background_color(window, GColorWhite);
  window_set_fullscreen(window, true);
  window_set_window_handlers(window, (WindowHandlers) {
    .load = window_load,
    .unload = window_unload
  });

  const int inbound_size = 64;
  const int outbound_size = 64;
  app_message_open(inbound_size, outbound_size);

  const bool animated = true;
  window_stack_push(window, animated);
}

static void deinit(void) {
  window_destroy(window);
}

int main(void) {
  init();
  app_event_loop();
  deinit();
}
