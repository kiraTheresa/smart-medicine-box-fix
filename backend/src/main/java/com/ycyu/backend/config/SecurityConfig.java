package com.ycyu.backend.config;

import com.ycyu.backend.service.UserDetailsServiceImpl;
import com.ycyu.backend.utils.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Autowired
    private JwtUtils jwtUtils;
    
    @Autowired
    private UserDetailsServiceImpl userDetailsService;
    
    // 配置密码加密器
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    // 配置认证管理器
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }
    
    // 配置安全过滤器链
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // 禁用CSRF保护
            .csrf(csrf -> csrf.disable())
            // 禁用会话管理，使用无状态认证
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // 配置CORS - 使用全局配置
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            // 配置授权规则
            .authorizeHttpRequests(auth -> auth
                // 允许所有请求访问登录和注册接口
                .requestMatchers("/api/auth/**").permitAll()
                // 允许WebSocket请求
                .requestMatchers("/ws/**").permitAll()
                // 允许静态资源请求
                .requestMatchers("/static/**").permitAll()
                .requestMatchers("/index.html").permitAll()
                
                // 药品相关API - 管理员拥有所有权限，用户只能查看
                .requestMatchers(HttpMethod.GET, "/api/medicines/**").authenticated()
                .requestMatchers("/api/medicines/**").hasRole("ADMIN")
                
                // 设备相关API - 管理员拥有所有权限，用户只能查看
                .requestMatchers(HttpMethod.GET, "/api/nodemcu/config", "/api/nodemcu/devices").authenticated()
                .requestMatchers("/api/nodemcu/**").hasRole("ADMIN")
                
                // 离线事件API - 管理员拥有所有权限，用户只能查看自己设备的事件
                .requestMatchers(HttpMethod.GET, "/api/offline-events/device/**").authenticated()
                .requestMatchers("/api/offline-events/**").hasRole("ADMIN")
                
                // 管理员专属接口
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                
                // 用户专属接口
                .requestMatchers("/api/user/**").hasRole("USER")
                
                // 其他接口需要认证
                .anyRequest().authenticated()
            );
        
        // 添加JWT认证过滤器
        http.addFilterBefore(new JwtAuthenticationFilter(jwtUtils, userDetailsService), UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
    
    // 配置CORS
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000", "http://127.0.0.1:3000"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("authorization", "content-type", "xsrf-token"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(Arrays.asList("xsrf-token"));
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}