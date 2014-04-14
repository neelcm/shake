#include "pebble.h"
 
static Window *window;
 
static TextLayer *name_layer;
static TextLayer *phone_layer;
static BitmapLayer *icon_layer;
static TextLayer *resp_y_layer;
 
static GBitmap *icon_bitmap = NULL;
 
static AppSync sync;
static uint8_t sync_buffer[64];
 
bool data_handshake;
bool tap_handshake;
 
enum ShakeKeys {
 ID_KEY = 0x0,         // TUPLE_INT
 NAME_KEY = 0x1,  // TUPLE_CSTRING
 PHONE_KEY = 0x2
};
 
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
 
 
static void createPopup() {
 
Layer *window_layer = window_get_root_layer(window);
 
resp_y_layer = text_layer_create(GRect(0,0,144,168));
       text_layer_set_text_color(resp_y_layer, GColorClear);
       text_layer_set_background_color(resp_y_layer, GColorClear);
       text_layer_set_font(resp_y_layer, fonts_get_system_font(FONT_KEY_GOTHIC_28_BOLD));
       text_layer_set_text_alignment(resp_y_layer, GTextAlignmentCenter);
       layer_add_child(window_layer, text_layer_get_layer(resp_y_layer));
// printing promp message to watchface 
text_layer_set_text(resp_y_layer, "     UP->YES                                           Exchange            Contact?                              DOWN->NO");
 
 
}
 
static void showPopup() {
text_layer_set_text_color(resp_y_layer, GColorWhite);
       text_layer_set_background_color(resp_y_layer, GColorBlack);
 
text_layer_set_text_color(name_layer, GColorClear);
       text_layer_set_background_color(name_layer, GColorClear);
text_layer_set_text_color(phone_layer, GColorClear);
       text_layer_set_background_color(phone_layer, GColorClear);
 
}
 
static void dismissPopup() {
text_layer_set_text_color(resp_y_layer, GColorClear);
       text_layer_set_background_color(resp_y_layer, GColorClear);
text_layer_set_text_color(name_layer, GColorBlack);
text_layer_set_text_color(phone_layer, GColorBlack);
 
}
 
static void up_click_handler(ClickRecognizerRef recognizer, void *context) {
text_layer_set_text(name_layer, "FETCHING CONTACT...");
send_cmd();
dismissPopup();
}
 
static void down_click_handler(ClickRecognizerRef recognizer, void *context) {
text_layer_set_text(name_layer, "Neel");
text_layer_set_text(phone_layer, "Ready");
dismissPopup();
 
}
 
 
 
void accel_tap_handler(AccelAxisType axis, int32_t direction) {
 
 
 // Process tap on ACCEL_AXIS_X, ACCEL_AXIS_Y or ACCEL_AXIS_Z
 // Direction is 1 or -1
 
   if (axis == ACCEL_AXIS_Y)
   {
       APP_LOG(APP_LOG_LEVEL_ERROR, "tap from Y AXIS detected!!");
       tap_handshake = true;
   }
 
 int x = direction;
 
 char *str="xxxxxxxxxx";
 snprintf(str, sizeof(str), "%d", x);
 APP_LOG(APP_LOG_LEVEL_ERROR, str);
}
 
void handle_init(void) {
 accel_tap_service_subscribe(&accel_tap_handler);
}
 
void handle_deinit(void) {
 accel_tap_service_unsubscribe();
}
 
// batch
void accel_data_handler(AccelData *data, uint32_t num_samples) {
 // Process 10 events - every 1 second
 
 int total_x = 0;
 int total_y = 0;
 int total_z = 0;
 int avg_x = 0;
 int avg_y = 0;
 int avg_z = 0;
 for(uint32_t i = 0; i < num_samples; i++)
   {
     total_x += (int)data[i].x;
     total_y += (int)data[i].y;
     total_z += (int)data[i].z;
   }
 
   avg_x = total_x/(int)num_samples;
   avg_y = total_y/(int)num_samples;
   avg_z = total_z/(int)num_samples;
 
   char *str_x="xxxxxxxxxx";
   snprintf(str_x, sizeof(str_x), "%d", avg_x);
   APP_LOG(APP_LOG_LEVEL_ERROR, str_x);
 
   char *str_y="xxxxxxxxxx";
   snprintf(str_y, sizeof(str_y), "%d", avg_y);
   APP_LOG(APP_LOG_LEVEL_ERROR, str_y);
 
   char *str_z="xxxxxxxxxx";
   snprintf(str_z, sizeof(str_z), "%d", avg_z);
   APP_LOG(APP_LOG_LEVEL_ERROR, str_z);
 
   if ((int)avg_y > 400)
     {
       if ( (int)avg_x < 200 )
       {
         if ( (int) avg_z < 200)
           {
             APP_LOG(APP_LOG_LEVEL_ERROR, "accel data detected!!");
             data_handshake = true;
           }
       }
       
     }
}
 
 
static void handle_tick(struct tm *tick_time, TimeUnits units_changed)
{
       APP_LOG(APP_LOG_LEVEL_ERROR, "checking for handshake...");
       if (data_handshake == true && tap_handshake == true)
       {
         vibes_double_pulse();
         
         text_layer_set_text(phone_layer, "");
         text_layer_set_text(name_layer, "");
         APP_LOG(APP_LOG_LEVEL_ERROR, "handshake detected!");
showPopup();
         //send_cmd();
         data_handshake = false;
         tap_handshake = false;
         accel_data_service_unsubscribe();
         accel_tap_service_unsubscribe();
       }
}
 
 
static void select_click_handler(ClickRecognizerRef recognizer, void *context) {
 // register for batch sampling
 
 
}
 
 
 
static void click_config_provider(void *context) {
 window_single_click_subscribe(BUTTON_ID_SELECT, select_click_handler);
 window_single_click_subscribe(BUTTON_ID_UP, up_click_handler);
 window_single_click_subscribe(BUTTON_ID_DOWN, down_click_handler);
}
 
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
     //if(new_tuple->value->cstring[0] == 'x') send_cmd();
     text_layer_set_text(name_layer, new_tuple->value->cstring);
     break;
 
   case PHONE_KEY:
   //if(new_tuple->value->cstring[0] == 'x') send_cmd();
   text_layer_set_text(phone_layer, new_tuple->value->cstring);
   break;
 }
}
 
 
 
 
static void window_load(Window *window) {
 Layer *window_layer = window_get_root_layer(window);
 
 icon_layer = bitmap_layer_create(GRect(32, 10, 80, 80));
 layer_add_child(window_layer, bitmap_layer_get_layer(icon_layer));
 
 // topLayer = text_layer_create(GRect(0, 35, 144, 68));
 // text_layer_set_text_color(topLayer, GColorBlack);
 // text_layer_set_background_color(topLayer, GColorClear);
 // text_layer_set_font(topLayer, fonts_get_system_font(FONT_KEY_GOTHIC_28_BOLD));
 // text_layer_set_text_alignment(topLayer, GTextAlignmentCenter);
 // layer_add_child(window_layer, text_layer_get_layer(name_layer));
 
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
   TupletCString(NAME_KEY, "Neel"),
   TupletCString(PHONE_KEY, "Ready")
 };
 
 app_sync_init(&sync, sync_buffer, sizeof(sync_buffer), initial_values, ARRAY_LENGTH(initial_values),
     sync_tuple_changed_callback, sync_error_callback, NULL);
 
 //send_cmd();
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
 
// window_single_click_subscribe(BUTTON_ID_SELECT, select_click_handler);
 
window_set_click_config_provider(window, &click_config_provider);
 
 const int inbound_size = 64;
 const int outbound_size = 64;
 app_message_open(inbound_size, outbound_size);
 
 const bool animated = true;
 
 data_handshake = true;
 tap_handshake = false;
 
 createPopup();
 
 accel_service_set_samples_per_update(25);
 accel_data_service_subscribe(25, &accel_data_handler);
 accel_tap_service_subscribe(&accel_tap_handler);
 tick_timer_service_subscribe(SECOND_UNIT, &handle_tick);
 accel_service_set_sampling_rate(ACCEL_SAMPLING_10HZ);
 
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
