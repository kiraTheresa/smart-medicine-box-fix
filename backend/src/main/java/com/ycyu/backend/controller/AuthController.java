package com.ycyu.backend.controller;

import com.ycyu.backend.entity.User;
import com.ycyu.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    @Autowired
    private UserService userService;
    
    // 登录接口（简化版，直接验证用户名和密码）
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> loginRequest) {
        String username = loginRequest.get("username");
        String password = loginRequest.get("password");
        
        logger.info("Login attempt for username: {}", username);
        
        try {
            // 根据用户名查找用户
            User user = userService.findByUsername(username).orElse(null);
            
            if (user == null) {
                logger.warn("User not found: {}", username);
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "用户名不存在");
                response.put("errorType", "USER_NOT_FOUND");
                return ResponseEntity.status(401).body(response);
            }
            
            // 验证密码（明文比较）
            if (!password.equals(user.getPassword())) {
                logger.warn("Invalid password for user: {}", username);
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "密码错误");
                response.put("errorType", "PASSWORD_INCORRECT");
                return ResponseEntity.status(401).body(response);
            }
            
            // 构建响应
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            
            // 构建用户对象
            Map<String, Object> userObj = new HashMap<>();
            userObj.put("id", user.getId());
            userObj.put("username", username);
            userObj.put("name", user.getName());
            userObj.put("role", user.getRole());
            userObj.put("phone", user.getPhone());
            userObj.put("email", user.getEmail());
            userObj.put("enabled", user.isEnabled());
            
            response.put("user", userObj);
            response.put("message", "登录成功");
            
            logger.info("Login successful for user: {}", username);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Login failed for user: {}. Error: {}", username, e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "登录失败: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    // 注册接口
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody User user) {
        try {
            // 检查用户名是否已存在
            if (userService.existsByUsername(user.getUsername())) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "用户名已存在");
                return ResponseEntity.badRequest().body(response);
            }
            
            // 检查邮箱是否已存在
            if (user.getEmail() != null && !user.getEmail().isEmpty() && userService.existsByEmail(user.getEmail())) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "邮箱已存在");
                return ResponseEntity.badRequest().body(response);
            }
            
            // 注册用户
            User registeredUser = userService.register(user);
            
            // 构建响应
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "注册成功");
            response.put("user", registeredUser);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "注册失败: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}