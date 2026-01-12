package com.ycyu.backend.dto;

import jakarta.validation.constraints.*;

public class MedicineDTO {
    private Integer id;

    @NotBlank(message = "药品名称不能为空")
    @Size(max = 50, message = "药品名称最多50个字符")
    private String name;

    @NotBlank(message = "剂量不能为空")
    @Size(max = 20, message = "剂量最多20个字符")
    private String dosage;

    @NotNull(message = "小时不能为空")
    @Min(value = 0, message = "小时必须在0-23之间")
    @Max(value = 23, message = "小时必须在0-23之间")
    private Integer hour;

    @NotNull(message = "分钟不能为空")
    @Min(value = 0, message = "分钟必须在0-59之间")
    @Max(value = 59, message = "分钟必须在0-59之间")
    private Integer minute;

    @NotNull(message = "药格编号不能为空")
    @Min(value = 1, message = "药格编号必须是1或2")
    @Max(value = 2, message = "药格编号必须是1或2")
    private Integer boxNum;

    private Boolean enabled = true;

    // Getter和Setter方法
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDosage() {
        return dosage;
    }

    public void setDosage(String dosage) {
        this.dosage = dosage;
    }

    public Integer getHour() {
        return hour;
    }

    public void setHour(Integer hour) {
        this.hour = hour;
    }

    public Integer getMinute() {
        return minute;
    }

    public void setMinute(Integer minute) {
        this.minute = minute;
    }

    public Integer getBoxNum() {
        return boxNum;
    }

    public void setBoxNum(Integer boxNum) {
        this.boxNum = boxNum;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }
}