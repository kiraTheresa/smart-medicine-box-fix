package com.ycyu.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ycyu.backend.service.MqttService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.channel.DirectChannel;
import org.springframework.integration.mqtt.core.MqttPahoClientFactory;
import org.springframework.integration.mqtt.inbound.MqttPahoMessageDrivenChannelAdapter;
import org.springframework.integration.mqtt.outbound.MqttPahoMessageHandler;
import org.springframework.integration.router.PayloadTypeRouter;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageHandler;
import org.springframework.messaging.Message;

import java.nio.charset.StandardCharsets;

@Configuration
public class MqttIntegrationConfig {

    @Autowired
    private MqttPahoClientFactory mqttClientFactory;

    @Autowired
    private MqttService mqttService;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private com.ycyu.backend.service.DeviceEventService deviceEventService;

    // 出站通道（发送消息）
    @Bean
    public MessageChannel mqttOutboundChannel() {
        return new DirectChannel();
    }

    // 入站通道（接收消息）
    @Bean
    public MessageChannel mqttInboundChannel() {
        return new DirectChannel();
    }

    // MQTT 出站处理器
    @Bean
    @ServiceActivator(inputChannel = "mqttOutboundChannel")
    public MqttPahoMessageHandler mqttOutbound() {
        MqttPahoMessageHandler handler = new MqttPahoMessageHandler(
                "backend-server-out",
                mqttClientFactory
        );
        handler.setAsync(true);
        handler.setDefaultQos(1);
        handler.setDefaultRetained(false);
        return handler;
    }

    // MQTT 入站适配器 - 订阅设备状态和事件
    @Bean
    public MqttPahoMessageDrivenChannelAdapter mqttInbound() {
        MqttPahoMessageDrivenChannelAdapter adapter = 
                new MqttPahoMessageDrivenChannelAdapter(
                        "backend-server-in",
                        mqttClientFactory,
                        "medicinebox/+/status",      // 订阅所有设备状态
                        "medicinebox/+/events"       // 订阅所有设备事件
                );
        adapter.setCompletionTimeout(5000);
        adapter.setQos(1);
        adapter.setOutputChannel(mqttInboundChannel());
        return adapter;
    }

    // MQTT 消息处理器 - 处理设备状态和事件
    @Bean
    @ServiceActivator(inputChannel = "mqttInboundChannel")
    public MessageHandler mqttMessageHandler() {
        return new MessageHandler() {
            @Override
            public void handleMessage(Message<?> message) throws org.springframework.messaging.MessagingException {
                try {
                    String payload = "";
                    
                    // 处理不同类型的消息负载
                    Object messagePayload = message.getPayload();
                    if (messagePayload instanceof byte[]) {
                        payload = new String((byte[]) messagePayload, StandardCharsets.UTF_8);
                    } else if (messagePayload instanceof String) {
                        payload = (String) messagePayload;
                    }
                    
                    String topic = (String) message.getHeaders().get("mqtt_receivedTopic");

                    // 从topic中提取设备ID
                    if (topic != null) {
                        if (topic.startsWith("medicinebox/") && topic.endsWith("/status")) {
                            String deviceId = topic.substring(12, topic.length() - 7); // 移除"medicinebox/"和"/status"

                            System.out.println("📡 收到设备状态消息:");
                            System.out.println("  设备ID: " + deviceId);
                            System.out.println("  状态: " + payload);

                            // 更新设备在线状态
                            mqttService.updateDeviceStatus(deviceId);

                            // 解析状态信息
                            if (payload.contains("\"mqttConnected\":true")) {
                                System.out.println("✅ 设备 " + deviceId + " MQTT连接正常");
                            }
                            if (payload.contains("\"arduinoReady\":true")) {
                                System.out.println("✅ 设备 " + deviceId + " Arduino已就绪");
                            }
                        } 
                        // 处理设备事件消息
                        else if (topic.startsWith("medicinebox/") && topic.endsWith("/events")) {
                            String deviceId = topic.substring(12, topic.length() - 7); // 移除"medicinebox/"和"/events"
                            
                            System.out.println("📡 收到设备事件消息:");
                            System.out.println("  设备ID: " + deviceId);
                            System.out.println("  事件: " + payload);
                            
                            // 更新设备在线状态
                            mqttService.updateDeviceStatus(deviceId);
                            
                            // 处理紧急事件
                            if ("EMERGENCY".equals(payload.trim())) {
                                System.out.println("🚨 设备 " + deviceId + " 触发紧急状态");
                                // 调用DeviceEventService发送紧急通知
                                deviceEventService.handleDeviceWarning(deviceId, "EMERGENCY", "设备 " + deviceId + " 长按触发紧急报警");
                            } 
                            // 处理紧急事件取消
                            else if ("EMERGENCY_CANCEL".equals(payload.trim())) {
                                System.out.println("✅ 设备 " + deviceId + " 取消紧急状态");
                                // 调用DeviceEventService发送取消通知
                                deviceEventService.handleDeviceWarning(deviceId, "EMERGENCY_CANCEL", "设备 " + deviceId + " 已取消紧急报警");
                            } 
                            // 处理服药确认
                            else if ("TAKEN".equals(payload.trim())) {
                                System.out.println("✅ 设备 " + deviceId + " 服药确认");
                                // 调用DeviceEventService发送服药确认通知
                                deviceEventService.handleMedicineTaken(deviceId, "未知药品");
                            }
                        }
                    }

                } catch (Exception e) {
                    System.err.println("处理MQTT消息时出错: " + e.getMessage());
                    e.printStackTrace();
                }
            }
        };
    }
}