package com.ycyu.backend.controller;

import com.ycyu.backend.entity.User;
import com.ycyu.backend.service.UserService;
import com.ycyu.backend.utils.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private UserDetailsService userDetailsService;
    
    @Autowired
    private JwtUtils jwtUtils;
    
    @Autowired
    private UserService userService;
    
    // 登录接口（简化版，不使用JWT）
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> loginRequest) {
        String username = loginRequest.get("username");
        String password = loginRequest.get("password");
        
        logger.info("Login attempt for username: {}", username);
        
        try {
            // 验证用户名和密码
            logger.debug("Attempting authentication for user: {}", username);
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password)
            );
            
            logger.debug("Authentication successful for user: {}", username);
            
            // 设置认证上下文
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            // 获取用户信息
            User user = userService.findByUsername(username).orElse(null);
            
            if (user == null) {
                logger.warn("User not found in database after authentication: {}", username);
            }
            
            // 构建响应（不包含JWT令牌）
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            
            // 构建用户对象
            Map<String, Object> userObj = new HashMap<>();
            userObj.put("id", user != null ? user.getId() : null);
            userObj.put("username", username);
            userObj.put("name", user != null ? user.getName() : null);
            userObj.put("role", user != null ? user.getRole() : null);
            userObj.put("phone", user != null ? user.getPhone() : null);
            userObj.put("email", user != null ? user.getEmail() : null);
            userObj.put("enabled", user != null ? user.isEnabled() : null);
            
            response.put("user", userObj);
            response.put("message", "登录成功");
            
            logger.info("Login successful for user: {}", username);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Login failed for user: {}. Error: {}", username, e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            
            // 区分用户不存在和密码错误
            if (e.getMessage().contains("用户不存在")) {
                response.put("message", "用户名不存在");
                response.put("errorType", "USER_NOT_FOUND");
            } else {
                response.put("message", "密码错误");
                response.put("errorType", "PASSWORD_INCORRECT");
            }
            
            return ResponseEntity.status(401).body(response);
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
    
    // 获取当前用户信息（简化版，不使用JWT）
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "未认证");
            return ResponseEntity.status(401).body(response);
        }
        
        String username = authentication.getName();
        User user = userService.findByUsername(username).orElse(null);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("user", user);
        
        return ResponseEntity.ok(response);
    }
}