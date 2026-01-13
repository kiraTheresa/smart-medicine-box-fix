package com.ycyu.backend.service;

import com.ycyu.backend.entity.User;
import com.ycyu.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    // 注册新用户
    public User register(User user) {
        // 直接存储密码，不加密
        // 设置默认角色为USER
        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole("USER");
        }
        return userRepository.save(user);
    }
    
    // 根据用户名查找用户
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }
    
    // 根据ID查找用户
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }
    
    // 获取所有用户
    public List<User> findAll() {
        return userRepository.findAll();
    }
    
    // 根据角色获取用户
    public List<User> findByRole(String role) {
        return userRepository.findByRole(role);
    }
    
    // 更新用户信息
    public User updateUser(User user) {
        return userRepository.save(user);
    }
    
    // 删除用户
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
    
    // 检查用户名是否存在
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }
    
    // 检查邮箱是否存在
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }
}