---
title: 非线性控制
kind: article
date: 2026-11-10
description: ''
tags:
  - 控制理论
updated: 2026-11-10
draft: false
order: null
ai: ''
note: ''
---

## concepts
1. equilibrium point
\dot{x} = f(x), \dot{Xe} = 0. 
外界输入等于0的位置是平衡点。如果在该点处初值为0，会永远静止

2. attractive 
lim_{t->inf} X(t) = 0 
系统会随时间收敛到原点（或某一点）

3. global attractive
for all X(0), lim_{t->inf} X(t) = 0
无论系统初值，最终都会收敛到原点

4. boundness of solutions
for all \theta > 0, there exists \episilon >0, ||X(0)|| <\theta => ||X(t)|| < \epsilon
任意一个初值，系统都不会发散到无穷远处

5. Lyapunov stability
for all \episilon > 0, there exists \theta > 0, ||X(0)|| <\theta => ||X(t)|| < \epsilon
对于任意一个位置，都存在某个初值，系统不会发散到更远处

6. asymptotic stability 
= Lyapunov stable + attractive.

7. exponenial stability
There exists \theta, \alpha, \beta, ||X(0)|| <\theta => ||X(t)|| < \alpha* ||X(0)||exp{-\beta t}
收敛到平衡点的速度达到或超过指数级别
8. global stability
= stable + globally attractive
9. Global Asymptotic Stability
= asymptotic stablity + globally attractive
10. Global Expotential Stability
= expotential stability + global attractive
