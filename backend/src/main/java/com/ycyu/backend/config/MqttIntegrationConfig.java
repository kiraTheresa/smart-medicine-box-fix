package com.ycyu.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ycyu.backend.service.MqttService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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

    // MQTT 入站适配器 - 订阅设备状态
    @Bean
    public MqttPahoMessageDrivenChannelAdapter mqttInbound() {
        MqttPahoMessageDrivenChannelAdapter adapter = 
                new MqttPahoMessageDrivenChannelAdapter(
                        "backend-server-in",
                        mqttClientFactory,
                        "medicinebox/+/status"      // 订阅所有设备状态
                );
        adapter.setCompletionTimeout(5000);
        adapter.setQos(1);
        adapter.setOutputChannel(mqttInboundChannel());
        return adapter;
    }

    // MQTT 消息处理器 - 处理设备状态和发现
    @Bean
    public MessageHandler mqttMessageHandler() {
        return new MessageHandler() {
            @Override
            public void handleMessage(Message<?> message) throws org.springframework.messaging.MessagingException {
                try {
                    byte[] payloadBytes = (byte[]) message.getPayload();
                    String payload = new String(payloadBytes, StandardCharsets.UTF_8);
                    String topic = (String) message.getHeaders().get("mqtt_receivedTopic");

                    // 从topic中提取设备ID
                    if (topic != null && topic.startsWith("medicinebox/") && topic.endsWith("/status")) {
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

                } catch (Exception e) {
                    System.err.println("处理MQTT消息时出错: " + e.getMessage());
                    e.printStackTrace();
                }
            }
        };
    }
}