package com.ycyu.backend.controller;

import com.ycyu.backend.dto.MedicineDTO;
import com.ycyu.backend.service.MedicineService;
import com.ycyu.backend.service.MqttService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/nodemcu")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"})
public class NodeMCUController {

    @Autowired
    private MedicineService medicineService;

    @Autowired
    private MqttService mqttService;

    @GetMapping("/config")
    public ResponseEntity<String> getConfigForNodeMCU() {
        List<MedicineDTO> medicines = medicineService.getActiveMedicines();

        StringBuilder config = new StringBuilder();
        config.append("Medicine medicines[MAX_MEDICINES] = {\n");

        for (int i = 0; i < medicines.size() && i < 6; i++) {
            MedicineDTO med = medicines.get(i);
            config.append(String.format(
                    "  {\"%s\", \"%s\", %d, %d, false, %s, %d}",
                    med.getName(),
                    med.getDosage(),
                    med.getHour(),
                    med.getMinute(),
                    med.getEnabled() ? "true" : "false",
                    med.getBoxNum()
            ));

            if (i < medicines.size() - 1 && i < 5) {
                config.append(",");
            }
            config.append("\n");
        }

        for (int i = medicines.size(); i < 6; i++) {
            config.append("  {\"\", \"\", 0, 0, false, false, 1}");
            if (i < 5) config.append(",");
            config.append("\n");
        }

        config.append("};\n");

        return ResponseEntity.ok(config.toString());
    }

    @PostMapping("/sync")
    public ResponseEntity<Map<String, Object>> syncToNodeMCU(
            @RequestParam String deviceId,
            @RequestParam(required = false) String ipAddress) {

        List<MedicineDTO> medicines = medicineService.getActiveMedicines();

        // 通过MQTT同步配置到设备
        try {
            mqttService.syncMedicinesToDevice(deviceId, medicines);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "配置已通过MQTT发送到设备: " + deviceId);
            response.put("medicines", medicines.size());
            response.put("deviceId", deviceId);
            response.put("timestamp", System.currentTimeMillis());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "同步失败: " + e.getMessage());
            response.put("deviceId", deviceId);

            return ResponseEntity.status(500).body(response);
        }
    }

    // 发送命令到设备
    @PostMapping("/command")
    public ResponseEntity<Map<String, Object>> sendCommand(
            @RequestParam String deviceId,
            @RequestParam String command,
            @RequestBody(required = false) Map<String, Object> data) {

        try {
            if (data == null) {
                data = new HashMap<>();
            }

            mqttService.sendCommand(deviceId, command, data);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "命令已发送到设备: " + deviceId);
            response.put("command", command);
            response.put("deviceId", deviceId);
            response.put("timestamp", System.currentTimeMillis());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "命令发送失败: " + e.getMessage());
            response.put("deviceId", deviceId);

            return ResponseEntity.status(500).body(response);
        }
    }

    // 获取在线设备
    @GetMapping("/devices")
    public ResponseEntity<Map<String, Object>> getOnlineDevices() {
        List<String> devices = mqttService.getOnlineDevices();

        // 如果没有发现设备，添加默认设备（你的设备ID）
        if (devices.isEmpty()) {
            devices.add("medicinebox_E8DB8498F9E9");
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("devices", devices);
        response.put("timestamp", System.currentTimeMillis());

        return ResponseEntity.ok(response);
    }
}