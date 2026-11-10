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
\dot{x} = f(x), \dot{Xe} = 0. If initial condition Xe = 0, it will stay at the EP forever.
2. attractive 
lim_{x->inf} X(t) = 0 
3. global attractive
lim_{x->inf} X(t) = 0
4. boundness of solutions
for all \theta > 0, there exists \episilon >0, ||X(0)|| <\theta => ||X(t)|| < \epsilon
5. Lyapunov stability
for all \episilon > 0, there exists \theta > 0, ||X(0)|| <\theta => ||X(t)|| < \epsilon
6. asymptotic stability 
The system is AS, IFF it is Lyapunov stable and attractive.
7. exponenial stability
There exists \theta, \alpha, \beta, ||X(0)|| <\theta => ||X(t)|| < \alpha* ||X(0)||exp{-\beta t}
收敛到平衡点的速度达到或超过指数
8. global stability
= stable + globally attractive
9. Global Asymptotic Stability
= asymptotic stablity + globally attractive
10. Global Expotential Stability
= expotential stability + global attractive
